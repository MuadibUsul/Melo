import { z } from "zod";

/**
 * Centralized 12-factor environment schema. Every service (api / worker)
 * validates `process.env` through this at boot and fails fast on misconfig.
 * Secrets are server-only — never expose these to the browser.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Core infra
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres")),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // S3-compatible object storage
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("music-assets"),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  // MiniMax (server-only)
  MINIMAX_BASE_URL: z.string().default("https://api.minimax.io"),
  MINIMAX_API_KEY: z.string().optional(),
  MINIMAX_GROUP_ID: z.string().optional(),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(8).default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(8).default("dev-refresh-secret-change-me"),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2592000),

  // Service wiring
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().default("http://localhost:4000"),

  // Payments
  PAYMENT_PROVIDER: z.enum(["mock", "stripe", "wechat", "alipay"]).default("mock"),
  STRIPE_SECRET_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

/** Parse & cache the environment. Throws a readable error on invalid config. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** True when MiniMax credentials are present (otherwise mock provider is used). */
export function hasMiniMaxEnv(env: AppEnv = loadEnv()): boolean {
  return Boolean(env.MINIMAX_API_KEY);
}
