import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AudioLines, ExternalLink, Play } from "lucide-react";
import { getSeedTrack } from "@/lib/fallback/catalog";

interface EmbedTrack {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  tags?: string[];
  creator: { displayName: string };
  asset?: { storageKey?: string | null; streamKey?: string | null; durationMs?: number | null };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

type EmbedPageProps = { params: Promise<{ id: string }> };

async function getEmbedTrack(id: string): Promise<EmbedTrack | null> {
  try {
    const response = await fetch(`${API_BASE}/tracks/${id}`, { cache: "no-store" });
    if (response.ok) return response.json() as Promise<EmbedTrack>;
  } catch {
    // Fall back to bundled Melo catalog when the API is unavailable.
  }

  const seed = getSeedTrack(id);
  if (!seed) return null;
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    genre: seed.genre,
    tags: seed.tags,
    creator: { displayName: seed.creator.displayName },
    asset: { storageKey: seed.audioUrl, streamKey: seed.audioUrl, durationMs: seed.durationMs },
  };
}

function formatDuration(ms?: number | null) {
  if (!ms) return "--:--";
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
  const { id } = await params;
  const track = await getEmbedTrack(id);
  if (!track) {
    return {
      title: "Melo 嵌入播放器",
      description: "在 Melo 播放中文 AI 音乐。",
      robots: { index: false, follow: true },
    };
  }

  const description = track.description || `${track.creator.displayName} 在 Melo 发布的 ${track.genre || "AI 音乐"}作品。`;
  const title = `${track.title} - Melo 播放器`;

  return {
    title,
    description,
    alternates: { canonical: `/song/${track.id}` },
    openGraph: {
      title,
      description,
      type: "music.song",
      url: `/song/${track.id}`,
      siteName: "Melo",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: false, follow: true },
  };
}

export default async function EmbedTrackPage({ params }: EmbedPageProps) {
  const { id } = await params;
  const track = await getEmbedTrack(id);
  if (!track) notFound();

  const audioUrl = track.asset?.streamKey || track.asset?.storageKey || "";
  const duration = formatDuration(track.asset?.durationMs);
  const tag = track.genre || track.tags?.[0] || "Melo";

  return (
    <main className="min-h-screen bg-[#050607] p-3 text-foreground">
      <section className="grid min-h-[156px] grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-lg border border-panel-border bg-[#101114] p-4 shadow-2xl">
        <div className="flex aspect-square items-center justify-center rounded-md bg-studio-gold/10 text-studio-gold">
          <AudioLines className="size-9" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-studio-gold/30 px-2 py-0.5 text-studio-gold">{tag}</span>
            <span>{duration}</span>
          </div>
          <h1 className="mt-2 truncate text-base font-semibold">{track.title}</h1>
          <div className="mt-1 truncate text-sm text-muted-foreground">{track.creator.displayName}</div>

          {audioUrl ? (
            <audio className="mt-3 h-9 w-full" controls preload="none" src={audioUrl}>
              <a href={audioUrl}>播放音频</a>
            </audio>
          ) : (
            <div className="mt-3 flex h-9 items-center gap-2 rounded-md border border-panel-border px-3 text-xs text-muted-foreground">
              <Play className="size-3" aria-hidden="true" />
              音频暂不可用
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <Link href={`/song/${track.id}`} target="_blank" className="inline-flex items-center gap-1 text-studio-gold">
              在 Melo 打开
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
            <span className="text-muted-foreground">melo</span>
          </div>
        </div>
      </section>
    </main>
  );
}
