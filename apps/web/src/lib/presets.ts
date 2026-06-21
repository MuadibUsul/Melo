import type { GenerateRequest } from "@/types/music";

export interface StudioPreset extends Partial<GenerateRequest> {
  prompt: string;
}

export const GENRES: readonly string[] = ["中文流行", "说唱", "国风", "民谣", "电子", "摇滚", "Lo-fi", "影视配乐", "游戏配乐"];
export const MOODS: readonly string[] = ["治愈", "孤独", "热血", "赛博朋克", "悲伤", "轻松", "高级", "神秘"];
export const VOCALS: readonly string[] = ["男声", "女声", "合唱", "无人声"];
export const DURATIONS: readonly string[] = ["30 秒副歌", "60 秒试听版", "完整歌曲"];
export const MODES: readonly string[] = ["ai", "custom", "instrumental"];

export function buildStudioHref(preset: StudioPreset): string {
  const params = new URLSearchParams();
  params.set("prompt", preset.prompt);
  if (preset.genre) params.set("genre", preset.genre);
  if (preset.mood) params.set("mood", preset.mood);
  if (preset.vocal) params.set("vocal", preset.vocal);
  if (preset.durationPreset) params.set("duration", preset.durationPreset);
  if (preset.lyricsMode) params.set("mode", preset.lyricsMode);
  return `/studio?${params.toString()}`;
}

type StudioSearchParams = {
  prompt?: string;
  genre?: string;
  mood?: string;
  vocal?: string;
  duration?: string;
  mode?: string;
};

export function parseStudioParams(sp: StudioSearchParams): Partial<GenerateRequest> {
  const out: Partial<GenerateRequest> = {};
  if (sp.prompt) out.prompt = sp.prompt;
  if (sp.genre && GENRES.includes(sp.genre)) out.genre = sp.genre;
  if (sp.mood && MOODS.includes(sp.mood)) out.mood = sp.mood;
  if (sp.vocal && VOCALS.includes(sp.vocal)) out.vocal = sp.vocal;
  if (sp.duration && DURATIONS.includes(sp.duration)) out.durationPreset = sp.duration;
  if (sp.mode && MODES.includes(sp.mode)) {
    out.lyricsMode = sp.mode as GenerateRequest["lyricsMode"];
  }
  if (out.lyricsMode === "instrumental") out.vocal = "无人声";
  if (out.vocal === "无人声") out.lyricsMode = "instrumental";
  return out;
}

export interface StudioTemplate {
  name: string;
  preset: StudioPreset;
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    name: "中文流行歌",
    preset: {
      prompt:
        "写一首普通话中文流行歌，女声，城市夜晚感，情绪克制，主题是一个人在深圳加班后走在雨里，不要模仿任何真实歌手。",
      genre: "中文流行",
      mood: "孤独",
      vocal: "女声",
      durationPreset: "60 秒试听版",
      lyricsMode: "ai",
    },
  },
  {
    name: "中文说唱",
    preset: {
      prompt: "写一首中文说唱，节奏稳，主题是年轻人在城市里重新找回自信，不要模仿任何真实歌手。",
      genre: "说唱",
      mood: "热血",
      vocal: "男声",
      durationPreset: "60 秒试听版",
      lyricsMode: "ai",
    },
  },
  {
    name: "国风",
    preset: {
      prompt: "写一首国风中文歌，男声，主题是少年离开故乡去远方，副歌要有记忆点，不能模仿任何真实歌手或真实歌曲。",
      genre: "国风",
      mood: "神秘",
      vocal: "男声",
      durationPreset: "完整歌曲",
      lyricsMode: "ai",
    },
  },
  {
    name: "民谣",
    preset: {
      prompt: "写一首温暖的中文民谣，木吉他为主，主题是老朋友多年后重逢，不要模仿真实歌手。",
      genre: "民谣",
      mood: "治愈",
      vocal: "男声",
      durationPreset: "60 秒试听版",
      lyricsMode: "ai",
    },
  },
  {
    name: "电子",
    preset: {
      prompt: "生成一首中文电子流行，女声，赛博朋克夜景，节奏清晰，不要引用真实歌曲。",
      genre: "电子",
      mood: "赛博朋克",
      vocal: "女声",
      durationPreset: "60 秒试听版",
      lyricsMode: "ai",
    },
  },
  {
    name: "短视频 BGM",
    preset: {
      prompt: "生成一段 30 秒短视频 BGM，无人声，适合生活方式 vlog，轻松、干净、有节奏。",
      genre: "影视配乐",
      mood: "轻松",
      vocal: "无人声",
      durationPreset: "30 秒副歌",
      lyricsMode: "instrumental",
    },
  },
  {
    name: "财经口播 BGM",
    preset: {
      prompt: "生成一段 30 秒短视频 BGM，无人声，适合财经口播，节奏稳定，高级、克制、略带科技感。",
      genre: "影视配乐",
      mood: "高级",
      vocal: "无人声",
      durationPreset: "30 秒副歌",
      lyricsMode: "instrumental",
    },
  },
  {
    name: "游戏配乐",
    preset: {
      prompt: "生成一段游戏配乐，无人声，神秘地下城探索感，循环友好，鼓点克制。",
      genre: "游戏配乐",
      mood: "神秘",
      vocal: "无人声",
      durationPreset: "完整歌曲",
      lyricsMode: "instrumental",
    },
  },
  {
    name: "ASMR 环境声",
    preset: {
      prompt: "生成一段 ASMR 环境声，无人声，雨夜窗边、柔和、安静，适合睡前短视频。",
      genre: "影视配乐",
      mood: "治愈",
      vocal: "无人声",
      durationPreset: "30 秒副歌",
      lyricsMode: "instrumental",
    },
  },
];
