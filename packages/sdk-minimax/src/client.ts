import { classifyHttpStatus, classifyProviderStatus, MiniMaxError } from "./errors.js";

// Verified live (2026-06): music generation is synchronous but takes 80-150s;
// lyrics/tts are faster. Keep timeouts comfortably above observed latency.
const MUSIC_TIMEOUT_MS = 290_000;
const DEFAULT_TIMEOUT_MS = 120_000;

export interface MiniMaxUsage {
  model: string;
  kind: "music" | "lyrics" | "tts";
  units: number; // characters (tts/lyrics) or 1 (per music generation)
  traceId?: string;
}

export interface MiniMaxConfig {
  apiKey: string;
  baseUrl?: string; // default https://api.minimax.io
  groupId?: string;
  maxRetries?: number;
  /** Cost-accounting hook — called once per successful provider call (plan §9.1f). */
  onUsage?: (usage: MiniMaxUsage) => void;
}

export interface GenerateMusicInput {
  model?: string; // music-2.6 | music-2.6-free | music-cover ...
  prompt?: string;
  lyrics?: string;
  isInstrumental?: boolean;
  outputFormat?: "url" | "hex";
  audioSetting?: { sample_rate: number; bitrate: number; format: string };
}

export interface GenerateMusicResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
  durationMs?: number;
  sampleRate?: number;
  bitrate?: number;
  sizeBytes?: number;
  traceId?: string;
  raw: unknown;
}

export interface GenerateLyricsInput {
  prompt: string;
}
export interface GenerateLyricsResult {
  title: string;
  lyrics: string;
  styleTags?: string;
  raw: unknown;
}

interface ProviderEnvelope {
  trace_id?: string;
  base_resp?: { status_code?: number; status_msg?: string };
}

/** Minimal per-model token bucket so we never hand MiniMax's RPM limit to users. */
class TokenBucket {
  private tokens: number;
  private last = Date.now();
  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
  }
  async take(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refillPerSec);
      this.last = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await delay(((1 - this.tokens) / this.refillPerSec) * 1000);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

export class MiniMaxClient {
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly buckets = new Map<string, TokenBucket>();

  constructor(private readonly config: MiniMaxConfig) {
    if (!config.apiKey) throw new Error("MiniMaxClient requires an apiKey");
    this.baseUrl = (config.baseUrl ?? "https://api.minimax.io").replace(/\/$/, "");
    this.maxRetries = config.maxRetries ?? 3;
  }

  private bucketFor(model: string): TokenBucket {
    let b = this.buckets.get(model);
    if (!b) {
      // Conservative defaults; real RPM should come from config per model.
      b = new TokenBucket(model.includes("free") ? 1 : 5, model.includes("free") ? 0.2 : 1);
      this.buckets.set(model, b);
    }
    return b;
  }

  private async call<T extends ProviderEnvelope>(
    path: string,
    body: unknown,
    timeoutMs: number,
    model: string,
  ): Promise<T> {
    await this.bucketFor(model).take();
    let attempt = 0;
    for (;;) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const url = new URL(`${this.baseUrl}${path}`);
        if (this.config.groupId) url.searchParams.set("GroupId", this.config.groupId);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const kind = classifyHttpStatus(res.status);
          if (kind === "transient" && attempt <= this.maxRetries) {
            await delay(backoff(attempt));
            continue;
          }
          throw new MiniMaxError(`MiniMax HTTP ${res.status} on ${path}`, kind, { httpStatus: res.status });
        }

        const json = (await res.json()) as T;
        const sc = json.base_resp?.status_code ?? 0;
        if (sc !== 0) {
          const kind = classifyProviderStatus(sc);
          if (kind === "transient" && attempt <= this.maxRetries) {
            await delay(backoff(attempt));
            continue;
          }
          throw new MiniMaxError(json.base_resp?.status_msg ?? `provider status ${sc}`, kind, {
            providerStatusCode: sc,
            traceId: json.trace_id,
          });
        }
        return json;
      } catch (err) {
        if (err instanceof MiniMaxError) throw err;
        // Network/abort → transient.
        if (attempt <= this.maxRetries) {
          await delay(backoff(attempt));
          continue;
        }
        const msg = err instanceof Error ? err.message : "network error";
        throw new MiniMaxError(`MiniMax request failed: ${msg}`, "transient");
      } finally {
        clearTimeout(timer);
      }
    }
  }

  async generateMusic(input: GenerateMusicInput): Promise<GenerateMusicResult> {
    const model = input.model ?? "music-2.6";
    const isInstrumental = Boolean(input.isInstrumental);
    const outputFormat = input.outputFormat ?? "url";
    if (!isInstrumental && !input.lyrics?.trim()) {
      throw new MiniMaxError("歌曲生成必须提供歌词。", "permanent");
    }
    const body = {
      model,
      prompt: input.prompt,
      lyrics: isInstrumental ? undefined : input.lyrics,
      is_instrumental: isInstrumental,
      output_format: outputFormat,
      lyrics_optimizer: !isInstrumental && !input.lyrics?.trim(),
      audio_setting: input.audioSetting ?? { sample_rate: 44100, bitrate: 256000, format: "mp3" },
    };

    const raw = await this.call<
      ProviderEnvelope & {
        data?: { audio?: string; status?: number };
        extra_info?: {
          music_duration?: number;
          music_sample_rate?: number;
          bitrate?: number;
          music_size?: number;
        };
      }
    >("/v1/music_generation", body, MUSIC_TIMEOUT_MS, model);

    const audio = raw.data?.audio;
    if (!audio) throw new MiniMaxError("MiniMax 未返回音频。", "permanent", { traceId: raw.trace_id });

    this.config.onUsage?.({ model, kind: "music", units: 1, traceId: raw.trace_id });

    const isUrl = outputFormat === "url" || audio.startsWith("http");
    return {
      ...(isUrl ? { audioUrl: audio } : { audioBuffer: Buffer.from(audio, "hex") }),
      durationMs: raw.extra_info?.music_duration,
      sampleRate: raw.extra_info?.music_sample_rate,
      bitrate: raw.extra_info?.bitrate,
      sizeBytes: raw.extra_info?.music_size,
      traceId: raw.trace_id,
      raw,
    };
  }

  /** Lyrics endpoint — VERIFIED: fields are TOP-LEVEL (lyrics / song_title), not under `data`. */
  async generateLyrics(input: GenerateLyricsInput): Promise<GenerateLyricsResult> {
    const model = "lyrics";
    const raw = await this.call<
      ProviderEnvelope & { lyrics?: string; song_title?: string; style_tags?: string }
    >("/v1/lyrics_generation", { mode: "write_full_song", prompt: input.prompt }, DEFAULT_TIMEOUT_MS, model);

    if (!raw.lyrics) {
      throw new MiniMaxError(raw.base_resp?.status_msg ?? "MiniMax 未返回歌词。", "permanent", {
        traceId: raw.trace_id,
      });
    }
    this.config.onUsage?.({ model, kind: "lyrics", units: raw.lyrics.length, traceId: raw.trace_id });
    return {
      title: raw.song_title ?? "未命名作品",
      lyrics: raw.lyrics,
      styleTags: raw.style_tags,
      raw,
    };
  }

  /** Text-to-speech (T2A v2). Returns hex-decoded audio buffer. */
  async textToSpeech(input: {
    model?: string;
    text: string;
    voiceId: string;
    speed?: number;
    vol?: number;
    pitch?: number;
    emotion?: string;
    languageBoost?: string;
    audioSetting?: { audio_sample_rate: number; bitrate: number; format: string; channel?: number };
  }): Promise<{ audioBuffer: Buffer; traceId?: string; raw: unknown }> {
    const model = input.model ?? "speech-2.6-hd";
    const body = {
      model,
      text: input.text,
      voice_setting: {
        voice_id: input.voiceId,
        speed: input.speed ?? 1,
        vol: input.vol ?? 1,
        pitch: input.pitch ?? 0,
        emotion: input.emotion ?? "auto",
      },
      audio_setting: input.audioSetting ?? {
        audio_sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
      language_boost: input.languageBoost,
    };
    const raw = await this.call<ProviderEnvelope & { data?: { audio?: string } }>(
      "/v1/t2a_v2",
      body,
      DEFAULT_TIMEOUT_MS,
      model,
    );
    const audio = raw.data?.audio;
    if (!audio) throw new MiniMaxError("MiniMax 未返回语音。", "permanent", { traceId: raw.trace_id });
    this.config.onUsage?.({ model, kind: "tts", units: input.text.length, traceId: raw.trace_id });
    return { audioBuffer: Buffer.from(audio, "hex"), traceId: raw.trace_id, raw };
  }
}

function backoff(attempt: number): number {
  const base = Math.min(8000, 2 ** attempt * 250);
  return base + Math.random() * 250; // jitter
}
