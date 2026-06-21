import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EntitlementService, estimateCost } from "../entitlement/entitlement.service";
import type { JobView, JobStatus } from "@music/contracts";
import type { Asset, GenerationJob } from "@prisma/client";

// ── Valid state transitions ──
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  queued: ["processing", "failed", "canceled"],
  processing: ["succeeded", "failed", "canceled"],
  succeeded: [],
  failed: [],
  canceled: [],
};

export const GENERATION_QUEUE = "generation";

export interface GenerationJobData {
  jobId: string;
  userId: string;
  type: string;
  params: Record<string, unknown>;
  holdId: string;
  creditCost: number;
}

function toJobView(job: GenerationJob & { assets?: Pick<Asset, "id">[] }): JobView {
  return {
    id: job.id,
    type: job.type as JobView["type"],
    mode: job.mode as JobView["mode"],
    status: job.status as JobStatus,
    creditCost: job.creditCost,
    errorCode: job.errorCode,
    assetId: job.assets?.[0]?.id ?? null,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlement: EntitlementService,
    @InjectQueue(GENERATION_QUEUE) private readonly queue: Queue<GenerationJobData>,
  ) {}

  // ── Entry point: POST /generation/jobs ──

  async createJob(
    userId: string,
    type: string,
    mode: string,
    params: Record<string, unknown>,
    idempotencyKey?: string,
    parentJobId?: string,
  ): Promise<{ job: JobView; isDuplicate: boolean }> {
    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.prisma.generationJob.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        this.logger.debug(`Idempotent hit: ${idempotencyKey}`);
        return { job: toJobView(existing), isDuplicate: true };
      }
    }

    // Validate type
    if (!["music", "tts", "voice_clone"].includes(type)) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: `未知的生成类型: ${type}` });
    }

    // Estimate cost
    const creditCost = estimateCost(type, params);
    if (creditCost <= 0) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "无法估算额度消耗。" });
    }

    // Check balance
    const balance = await this.entitlement.getBalance(userId);
    if (balance < creditCost) {
      throw new ConflictException({
        code: "ENTITLEMENT_INSUFFICIENT_CREDITS",
        message: "额度不足，请升级套餐。",
        details: { balance, required: creditCost },
      });
    }

    // Hold credits
    const holdId = await this.entitlement.hold(userId, creditCost, "generation", "");
    if (!holdId) {
      throw new ConflictException({
        code: "ENTITLEMENT_INSUFFICIENT_CREDITS",
        message: "额度不足，请升级套餐。",
        details: { balance, required: creditCost },
      });
    }

    // Create job
    const job = await this.prisma.generationJob.create({
      data: {
        userId,
        type,
        mode,
        inputParams: params as Prisma.InputJsonValue,
        creditCost,
        holdId,
        idempotencyKey: idempotencyKey ?? null,
        parentJobId: parentJobId ?? null,
        status: "queued",
        provider: "minimax",
      },
    });

    // Update hold with correct refId
    await this.prisma.creditLedger.updateMany({
      where: { holdId },
      data: { refId: job.id },
    });

    // Enqueue to worker
    await this.queue.add("generate", {
      jobId: job.id,
      userId,
      type,
      params,
      holdId,
      creditCost,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });

    this.logger.log(`Job ${job.id} queued (type=${type}, cost=${creditCost})`);
    return { job: toJobView(job), isDuplicate: false };
  }

  // ── GET /generation/jobs/:id ──

  async getJob(jobId: string): Promise<JobView> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
      include: { assets: { select: { id: true }, take: 1 } },
    });
    if (!job) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "任务不存在。" });
    }
    return toJobView(job);
  }

  /** List user's jobs. */
  async listUserJobs(userId: string, page = 1, pageSize = 20): Promise<{ items: JobView[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.generationJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { assets: { select: { id: true }, take: 1 } },
      }),
      this.prisma.generationJob.count({ where: { userId } }),
    ]);
    return { items: items.map(toJobView), total };
  }

  // ── State transitions (called by worker) ──

  async transition(jobId: string, target: JobStatus, errorCode?: string): Promise<GenerationJob> {
    const job = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException({ code: "NOT_FOUND", message: "任务不存在。" });

    const current = job.status as JobStatus;
    const allowed = TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new ConflictException({
        code: "GENERATION_INVALID_STATE",
        message: `不允许从 ${current} 转换到 ${target}。`,
      });
    }

    const data: Record<string, unknown> = { status: target };
    if (target === "succeeded" || target === "failed") {
      data.completedAt = new Date();
    }
    if (errorCode) {
      data.errorCode = errorCode;
    }

    return this.prisma.generationJob.update({ where: { id: jobId }, data });
  }

  /** Cancel a queued/processing job — refunds the hold. */
  async cancelJob(jobId: string): Promise<JobView> {
    const job = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException({ code: "NOT_FOUND", message: "任务不存在。" });

    if (!["queued", "processing"].includes(job.status)) {
      throw new ConflictException({
        code: "GENERATION_INVALID_STATE",
        message: `无法取消状态为 ${job.status} 的任务。`,
      });
    }

    if (job.holdId) {
      await this.entitlement.refund(job.holdId);
    }

    const updated = await this.prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "canceled", completedAt: new Date() },
    });

    return toJobView(updated);
  }
}
