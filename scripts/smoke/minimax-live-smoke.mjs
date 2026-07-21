import { MiniMaxClient, MiniMaxError } from "../../packages/sdk-minimax/dist/index.js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const skipIfMissing = process.argv.includes("--skip-if-missing");
const musicMode = process.argv.includes("--music");
const allowLocalProvider = process.argv.includes("--allow-local-provider");
loadDotEnv(resolve(process.cwd(), ".env"));

const apiKey = process.env.MINIMAX_API_KEY?.trim();
const groupId = process.env.MINIMAX_GROUP_ID?.trim();
const baseUrl = process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io";

function loadDotEnv(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;

    const key = trimmed.slice(0, equals).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

if (!apiKey) {
  const message = "MINIMAX_API_KEY is not set; live MiniMax smoke was not run.";
  if (skipIfMissing) {
    console.log(JSON.stringify({ status: "skipped", reason: message }, null, 2));
    process.exit(0);
  }
  console.error(message);
  process.exit(2);
}

const providerUrl = new URL(baseUrl);
const isLocalProvider =
  ["localhost", "127.0.0.1", "::1"].includes(providerUrl.hostname) ||
  providerUrl.hostname.endsWith(".local");

if (isLocalProvider && !allowLocalProvider) {
  console.error(
    `MINIMAX_BASE_URL points to a local provider (${baseUrl}); pass --allow-local-provider for protocol-mock validation.`,
  );
  process.exit(3);
}

const usage = [];
const client = new MiniMaxClient({
  apiKey,
  baseUrl,
  groupId,
  maxRetries: 1,
  onUsage: (item) => usage.push(item),
});

try {
  const startedAt = Date.now();
  const result = musicMode ? await runMusicSmoke(client) : await runLyricsSmoke(client);
  const elapsedMs = Date.now() - startedAt;

  console.log(
    JSON.stringify(
      {
        status: "ok",
        mode: musicMode ? "music" : "lyrics",
        baseUrl,
        providerKind: isLocalProvider ? "local" : "hosted",
        groupIdConfigured: Boolean(groupId),
        ...result.summary,
        elapsedMs,
        usage,
      },
      null,
      2,
    ),
  );
} catch (error) {
  if (error instanceof MiniMaxError) {
    console.error(
      JSON.stringify(
        {
          status: "failed",
          kind: error.kind,
          message: error.message,
          httpStatus: error.httpStatus ?? null,
          providerStatusCode: error.providerStatusCode ?? null,
          traceId: error.traceId ?? null,
        },
        null,
        2,
      ),
    );
  } else {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
  }
  process.exit(1);
}

async function runLyricsSmoke(client) {
  const result = await client.generateLyrics({
    prompt: "Write a short Chinese pop chorus about Melo turning a small idea into music. Keep it concise.",
  });

  if (!result.lyrics?.trim()) {
    throw new Error("MiniMax returned empty lyrics.");
  }

  return {
    summary: {
      title: result.title,
      lyricsLength: result.lyrics.length,
      styleTags: result.styleTags ?? null,
      traceId: result.raw?.trace_id ?? null,
    },
  };
}

async function runMusicSmoke(client) {
  const result = await client.generateMusic({
    model: process.env.MINIMAX_MUSIC_MODEL?.trim() || "music-2.6",
    prompt: "Melo live smoke: short bright Chinese pop demo with warm synths",
    lyrics:
      "[Verse]\nMelo turns a spark into sound\nIdeas rise and circle around\n\n[Chorus]\nBring the little melody alive\nLet the night begin to shine",
    isInstrumental: false,
    outputFormat: "hex",
  });

  if (!result.audioUrl?.trim() && !result.audioBuffer?.length) {
    throw new Error("MiniMax returned no music audio.");
  }

  return {
    summary: {
      audioKind: result.audioUrl ? "url" : "buffer",
      audioUrlHost: result.audioUrl ? new URL(result.audioUrl).host : null,
      audioBytes: result.audioBuffer?.length ?? null,
      durationMs: result.durationMs ?? null,
      sampleRate: result.sampleRate ?? null,
      bitrate: result.bitrate ?? null,
      sizeBytes: result.sizeBytes ?? null,
      traceId: result.traceId ?? result.raw?.trace_id ?? null,
    },
  };
}
