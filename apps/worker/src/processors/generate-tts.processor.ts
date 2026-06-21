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
 * TTS generation processor (plan §1.7).
 */
export async function generateTtsProcessor(
  job: Job<{ jobId: string; userId: string; holdId: string; creditCost: number; params: Record<string, unknown> }>,
  ctx: SharedContext,
): Promise<void> {
  const { jobId, userId, holdId, params } = job.data;

  await ctx.prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });

  try {
    const result = await ctx.minimax.textToSpeech({
      text: params.text as string,
      voiceId: params.voiceId as string,
      speed: params.speed as number | undefined,
      vol: params.vol as number | undefined,
      pitch: params.pitch as number | undefined,
      emotion: params.emotion as string | undefined,
      languageBoost: params.languageBoost as string | undefined,
    });

    const buffer = result.audioBuffer;
    const storageKey = await storeBuffer(ctx.s3, userId, jobId, buffer);

    await ctx.prisma.asset.create({
      data: {
        userId,
        jobId,
        type: "tts",
        storageKey,
        streamKey: storageKey,
        format: "mp3",
        status: "draft",
      },
    });

    await ctx.prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "succeeded", completedAt: new Date() },
    });

    if (holdId) {
      await commitHold(ctx, holdId);
    }

    console.log(`[worker] TTS job ${jobId} succeeded`);
  } catch (err) {
    const message = (err as Error).message;
    const errorCode = message.includes("permanent") ? "PROVIDER_PERMANENT" : "PROVIDER_TRANSIENT";
    const maxAttempts = job.opts.attempts ?? 1;
    const willRetry = errorCode === "PROVIDER_TRANSIENT" && job.attemptsMade + 1 < maxAttempts;

    await ctx.prisma.generationJob.update({
      where: { id: jobId },
      data: { status: willRetry ? "queued" : "failed", completedAt: willRetry ? null : new Date(), errorCode },
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

async function storeBuffer(env: AppEnv, userId: string, jobId: string, buffer: Buffer): Promise<string> {
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  const key = `assets/${userId}/${jobId}_tts.mp3`;
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
  }

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

async function commitHold(ctx: SharedContext, holdId: string): Promise<void> {
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
