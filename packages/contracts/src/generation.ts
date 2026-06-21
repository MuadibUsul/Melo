import { z } from "zod";
import { audioSettingSchema } from "./common.js";

export const GENERATION_TYPES = ["music", "tts", "voice_clone"] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const GENERATION_MODES = ["simple", "pro"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const JOB_STATUSES = ["queued", "processing", "succeeded", "failed", "canceled"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Music generation params (maps to MiniMax music_generation, plan §9.1). */
export const musicParamsSchema = z.object({
  prompt: z.string().trim().max(2000).optional(),
  lyrics: z.string().trim().max(3500).optional(),
  isInstrumental: z.boolean().default(false),
  audioSetting: audioSettingSchema.optional(),
});
export type MusicParams = z.infer<typeof musicParamsSchema>;

/** TTS params (maps to MiniMax t2a_v2, plan §9.1). */
export const ttsParamsSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  voiceId: z.string().min(1),
  speed: z.number().min(0.5).max(2).default(1),
  vol: z.number().min(0).max(10).default(1),
  pitch: z.number().min(-12).max(12).default(0),
  emotion: z
    .enum(["happy", "sad", "angry", "fearful", "disgusted", "surprised", "calm", "neutral", "auto"])
    .default("auto"),
  languageBoost: z.string().optional(),
});
export type TtsParams = z.infer<typeof ttsParamsSchema>;

export const createJobInput = z.object({
  type: z.enum(GENERATION_TYPES),
  mode: z.enum(GENERATION_MODES).default("simple"),
  presetId: z.string().optional(),
  parentJobId: z.string().optional(),
  params: z.record(z.string(), z.unknown()),
});
export type CreateJobInput = z.infer<typeof createJobInput>;

export interface JobView {
  id: string;
  type: GenerationType;
  mode: GenerationMode;
  status: JobStatus;
  creditCost: number;
  errorCode?: string | null;
  assetId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

/** Realtime event pushed over Socket.IO room `user:{userId}` (plan §9.4). */
export interface JobUpdatedEvent {
  jobId: string;
  status: JobStatus;
  progress?: number;
  errorCode?: string | null;
  assetId?: string | null;
}
