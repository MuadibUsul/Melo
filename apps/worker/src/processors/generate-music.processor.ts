import type { Job } from "bullmq";
import type { PrismaClient } from "@prisma/client";
import type { MiniMaxClient } from "@music/sdk-minimax";
import type { AppEnv } from "@music/config";
import {
  PutObjectCommand,
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

export interface SharedContext {
  prisma: PrismaClient;
  minimax: MiniMaxClient;
  redisUrl: string;
  s3: AppEnv;
}

/**
 * Music generation processor (plan §1.7).
 *
 * Flow: queued → processing → provider call → store audio → Asset(draft) →
 *   succeeded → commit hold.
 * On error: failed + refund hold + retry if transient.
 */
export async function generateMusicProcessor(
  job: Job<{ jobId: string; userId: string; holdId: string; creditCost: number; params: Record<string, unknown> }>,
  ctx: SharedContext,
): Promise<void> {
  const { jobId, userId, holdId, params } = job.data;

  // Transition to processing
  await ctx.prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });

  try {
    // Call MiniMax
    const result = await ctx.minimax.generateMusic({
      prompt: params.prompt as string | undefined,
      lyrics: params.lyrics as string | undefined,
      isInstrumental: (params.isInstrumental as boolean) ?? false,
    });

    // Download & store audio if a URL was returned
    let storageKey: string | undefined;
    let durationMs: number | undefined;

    if (result.audioUrl) {
      storageKey = await downloadAndStore(ctx.s3, userId, jobId, result.audioUrl);
    } else if (result.audioBuffer) {
      storageKey = await storeBuffer(ctx.s3, userId, jobId, result.audioBuffer);
    }

    durationMs = result.durationMs ?? undefined;

    // Create Asset record
    const asset = await ctx.prisma.asset.create({
      data: {
        userId,
        jobId,
        type: "music",
        storageKey: storageKey ?? result.audioUrl ?? "unknown",
        streamKey: storageKey,
        durationMs,
        format: "mp3",
        status: "draft",
      },
    });

    // Success — commit hold
    await ctx.prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "succeeded",
        completedAt: new Date(),
      },
    });

    // Commit the hold in the ledger
    if (holdId) {
      await commitHold(ctx, holdId);
    }

    console.log(`[worker] Music job ${jobId} succeeded → asset ${asset.id}`);
  } catch (err) {
    const errorCode = classifyError(err);
    const maxAttempts = job.opts.attempts ?? 1;
    const willRetry = errorCode === "PROVIDER_TRANSIENT" && job.attemptsMade + 1 < maxAttempts;

    await ctx.prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: willRetry ? "queued" : "failed",
        completedAt: willRetry ? null : new Date(),
        errorCode,
      },
    });

    if (!willRetry && holdId) {
      await refundHold(ctx, holdId);
    }

    if (willRetry) {
      throw err;
    }

    if (errorCode !== "PROVIDER_TRANSIENT") {
      job.discard();
    }
    throw err;
  }
}

async function downloadAndStore(env: AppEnv, userId: string, jobId: string, url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return storeBuffer(env, userId, jobId, buffer);
}

async function storeBuffer(env: AppEnv, userId: string, jobId: string, buffer: Buffer): Promise<string> {
  const client = getS3Client(env);
  const key = `assets/${userId}/${jobId}.mp3`;
  await ensureBucket(client, env.S3_BUCKET);
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "audio/mpeg",
    }),
  );
  return key;
}

function getS3Client(env: AppEnv): S3Client {
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

async function ensureBucket(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

async function commitHold(ctx: SharedContext, holdId: string): Promise<void> {
  const hold = await ctx.prisma.creditLedger.findFirst({
    where: { holdId, type: "hold" },
  });
  if (!hold) return;

  // Check not already settled
  const settled = await ctx.prisma.creditLedger.findFirst({
    where: { holdId, type: { in: ["commit", "refund"] } },
  });
  if (settled) return;

  await ctx.prisma.creditLedger.create({
    data: {
      userId: hold.userId,
      type: "commit",
      amount: 0,
      reason: hold.reason,
      refType: hold.refType,
      refId: hold.refId,
      holdId,
    },
  });
}

async function refundHold(ctx: SharedContext, holdId: string): Promise<void> {
  const hold = await ctx.prisma.creditLedger.findFirst({
    where: { holdId, type: "hold" },
  });
  if (!hold) return;

  const settled = await ctx.prisma.creditLedger.findFirst({
    where: { holdId, type: { in: ["commit", "refund"] } },
  });
  if (settled) return;

  await ctx.prisma.creditLedger.create({
    data: {
      userId: hold.userId,
      type: "refund",
      amount: Math.abs(hold.amount),
      reason: `refund:${hold.reason}`,
      refType: hold.refType,
      refId: hold.refId,
      holdId,
    },
  });
}

function classifyError(err: unknown): string {
  if (err instanceof Error && err.message.includes("MiniMax")) {
    return "PROVIDER_PERMANENT";
  }
  return "PROVIDER_TRANSIENT";
}
