import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "@music/config";
import { MiniMaxClient, MiniMaxError } from "@music/sdk-minimax";
import { generateMusicProcessor } from "./processors/generate-music.processor";
import { generateTtsProcessor } from "./processors/generate-tts.processor";

/**
 * Generation worker entrypoint (plan §1.7).
 * Registers BullMQ processors for each generation type.
 * Handles: queued → processing → succeeded/failed + hold→commit/refund.
 */
async function bootstrap(): Promise<void> {
  const env = loadEnv();

  const prisma = new PrismaClient();
  await prisma.$connect();

  const minimax = new MiniMaxClient({
    apiKey: env.MINIMAX_API_KEY ?? "MOCK_KEY",
    baseUrl: env.MINIMAX_BASE_URL,
    groupId: env.MINIMAX_GROUP_ID,
  });

  const shared = { prisma, minimax, redisUrl: env.REDIS_URL, s3: env };

  const worker = new Worker(
    "generation",
    async (job) => {
      const { type } = job.data as { type: string; jobId: string; userId: string };
      switch (type) {
        case "music":
          return generateMusicProcessor(job, shared);
        case "tts":
          return generateTtsProcessor(job, shared);
        default:
          throw new Error(`Unknown generation type: ${type}`);
      }
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 3,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, (err as Error).message);
  });

  console.log(
    JSON.stringify({
      service: "worker",
      status: "listening",
      env: env.NODE_ENV,
      queue: "generation",
    }),
  );
}

void bootstrap();
