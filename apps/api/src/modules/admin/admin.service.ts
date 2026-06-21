import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, Role } from "@prisma/client";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Metrics / Dashboard ──

  async getMetrics() {
    const [users, tracks, jobs, moderationPending, activeSubscriptions, playEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.track.count(),
      this.prisma.generationJob.count(),
      this.prisma.moderationCase.count({ where: { status: "pending" } }),
      this.prisma.subscription.count({ where: { status: "active" } }),
      this.prisma.playEvent.count(),
    ]);

    return {
      users,
      tracks,
      generationJobs: jobs,
      moderationPending,
      activeSubscriptions,
      playEvents,
    };
  }

  async getCosts() {
    const [totalJobs, failedJobs, succeededJobs, rows] = await Promise.all([
      this.prisma.generationJob.count(),
      this.prisma.generationJob.count({ where: { status: "failed" } }),
      this.prisma.generationJob.count({ where: { status: "succeeded" } }),
      this.prisma.generationJob.groupBy({
        by: ["type", "providerModel", "status"],
        _count: { _all: true },
        _sum: { creditCost: true },
      }),
    ]);

    return {
      totalJobs,
      succeededJobs,
      failedJobs,
      successRate: totalJobs ? Math.round((succeededJobs / totalJobs) * 1000) / 10 : 0,
      failedRate: totalJobs ? Math.round((failedJobs / totalJobs) * 1000) / 10 : 0,
      estimatedCostCents: rows.reduce((sum, row) => sum + (row._sum.creditCost ?? 0) * 10, 0),
      rows: rows.map((row) => ({
        model: row.providerModel ?? "minimax",
        type: row.type,
        status: row.status,
        calls: row._count._all,
        creditCost: row._sum.creditCost ?? 0,
        estimatedCostCents: (row._sum.creditCost ?? 0) * 10,
      })),
    };
  }

  async listSubscriptions(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, displayName: true, email: true } } },
      }),
      this.prisma.subscription.count(),
    ]);
    const planIds = [...new Set(items.map((item) => item.planId))];
    const plans = await this.prisma.plan.findMany({ where: { id: { in: planIds } } });
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    return { items: items.map((item) => ({ ...item, plan: planById.get(item.planId) ?? null })), total };
  }

  // ── Users ──

  async listUsers(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, displayName: true, email: true, role: true, status: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }

  async updateUserRole(userId: string, role: string) {
    if (!["FREE_USER", "PRO_USER", "ADMIN"].includes(role)) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "无效角色。" });
    }
    return this.prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
  }

  async suspendUser(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  }

  // ── Moderation Queue ──

  async getModerationQueue(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.moderationCase.count({ where: { status: "pending" } }),
    ]);
    return { items, total };
  }

  async reviewCase(caseId: string, decision: "approved" | "rejected", reviewerId: string, reason?: string) {
    const modCase = await this.prisma.moderationCase.update({
      where: { id: caseId },
      data: { status: decision === "approved" ? "approved" : "rejected", reviewerId, decisionAt: new Date(), reason: reason ?? null },
    });

    // If approved, publish the target
    if (decision === "approved" && modCase.targetType === "track") {
      await this.prisma.track.update({
        where: { id: modCase.targetId },
        data: { status: "published", publishedAt: new Date() },
      });
    } else if (decision === "rejected" && modCase.targetType === "track") {
      await this.prisma.track.update({
        where: { id: modCase.targetId },
        data: { status: "rejected" },
      });
    }

    return modCase;
  }

  // ── Audit Log ──

  async getAuditLogs(page = 1, pageSize = 50) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total };
  }

  async writeAuditLog(actorId: string | null, action: string, targetType?: string, targetId?: string, meta?: Record<string, unknown>) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        meta: meta ? (meta as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  // ── Seed all data ──

  async seedAll() {
    this.logger.log("Seeding plans, presets, voices...");
    // These are handled by their respective services via cron/bootstrap
    return { ok: true };
  }
}
