import { z } from "zod";

export const musicParamsSchema = z.object({
  prompt: z.string().min(1, "请输入创作提示"),
  genre: z.string().optional(),
  mood: z.string().optional(),
  vocal: z.string().optional(),
  lyricsMode: z.enum(["ai", "custom", "instrumental"]).default("ai"),
  durationPreset: z.string().optional(),
  outputFormat: z.enum(["mp3", "wav"]).default("mp3"),
  lyrics: z.string().optional(),
});

export type GenerateRequest = z.infer<typeof musicParamsSchema>;
