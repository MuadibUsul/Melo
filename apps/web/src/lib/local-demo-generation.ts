import type { JobView } from "@music/contracts";

export interface LocalDemoDraft {
  id: string;
  storageKey: string;
  audioUrl: string;
  durationMs: number;
  createdAt: string;
  prompt: string;
  genre: string;
  title?: string;
  publishedTrackId?: string;
}

export interface LocalDemoPublishedTrack {
  id: string;
  assetId: string;
  title: string;
  genre: string;
  visibility: string;
  audioUrl: string;
  durationMs: number;
  createdAt: string;
}

const DRAFTS_KEY = "melo.demo.drafts";
const PUBLISHED_KEY = "melo.demo.publishedTracks";
const LOCAL_USER_KEY = "melo.demo.user";

const SAMPLE_AUDIO = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalDemoCredits() {
  return readJson<{ credits?: number } | null>(LOCAL_USER_KEY, null)?.credits ?? null;
}

export function spendLocalDemoCredits(cost: number) {
  const user = readJson<{ credits?: number } | null>(LOCAL_USER_KEY, null);
  if (!user || cost <= 0) return { spent: false, balance: user?.credits ?? null };
  const currentCredits = user.credits ?? 0;
  if (currentCredits < cost) {
    return { spent: false, balance: currentCredits, error: `额度不足，还需要 ${cost - currentCredits} 额度。` };
  }
  const nextCredits = currentCredits - cost;
  writeJson(LOCAL_USER_KEY, { ...user, credits: nextCredits });
  window.dispatchEvent(new Event("credits-updated"));
  return { spent: true, balance: nextCredits };
}

function createId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

function pickAudio(seed: string) {
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SAMPLE_AUDIO[score % SAMPLE_AUDIO.length] ?? SAMPLE_AUDIO[0]!;
}

function titleFromPrompt(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Melo 本地草稿";
  return trimmed.length > 18 ? `${trimmed.slice(0, 18)}...` : trimmed;
}

export function getLocalDemoDrafts() {
  return readJson<LocalDemoDraft[]>(DRAFTS_KEY, []).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function saveLocalDemoDraft(input: { prompt?: string; genre?: string; type?: string; mode?: string; creditCost?: number }) {
  const prompt = input.prompt?.trim() || (input.type === "tts" ? "TTS 语音草稿" : "Melo 本地生成草稿");
  const createdAt = new Date().toISOString();
  const draft: LocalDemoDraft = {
    id: createId("demo-asset"),
    storageKey: pickAudio(prompt),
    audioUrl: pickAudio(prompt),
    durationMs: 60000 + (prompt.length % 6) * 15000,
    createdAt,
    prompt,
    genre: input.genre || "中文流行",
    title: titleFromPrompt(prompt),
  };
  const drafts = [draft, ...getLocalDemoDrafts()].slice(0, 20);
  writeJson(DRAFTS_KEY, drafts);

  const job: JobView & { isDuplicate: boolean } = {
    id: createId("demo-job"),
    type: input.type === "tts" ? "tts" : "music",
    mode: input.mode === "pro" ? "pro" : "simple",
    status: "succeeded",
    creditCost: input.creditCost ?? 0,
    assetId: draft.id,
    createdAt,
    completedAt: createdAt,
    isDuplicate: false,
  };

  return { draft, job };
}

export function deleteLocalDemoDraft(id: string) {
  writeJson(
    DRAFTS_KEY,
    getLocalDemoDrafts().filter((draft) => draft.id !== id),
  );
}

export function publishLocalDemoDraft(input: { assetId: string; title: string; genre: string; visibility: string }) {
  const drafts = getLocalDemoDrafts();
  const draft = drafts.find((item) => item.id === input.assetId);
  if (!draft) throw new Error("本地草稿不存在");

  const published: LocalDemoPublishedTrack = {
    id: createId("demo-track"),
    assetId: draft.id,
    title: input.title,
    genre: input.genre,
    visibility: input.visibility,
    audioUrl: draft.audioUrl,
    durationMs: draft.durationMs,
    createdAt: new Date().toISOString(),
  };
  writeJson(PUBLISHED_KEY, [published, ...getLocalDemoPublishedTracks()].slice(0, 30));
  writeJson(
    DRAFTS_KEY,
    drafts.map((item) => (item.id === draft.id ? { ...item, title: input.title, publishedTrackId: published.id } : item)),
  );
  return published;
}

export function getLocalDemoPublishedTracks() {
  return readJson<LocalDemoPublishedTrack[]>(PUBLISHED_KEY, []).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}
