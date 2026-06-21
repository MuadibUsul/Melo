import { z } from "zod";

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuery>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Audio settings shared by generation requests (plan §9.1). */
export const audioSettingSchema = z.object({
  sample_rate: z.number().int().default(44100),
  bitrate: z.number().int().default(256000),
  format: z.enum(["mp3", "wav", "pcm"]).default("mp3"),
});
export type AudioSetting = z.infer<typeof audioSettingSchema>;
