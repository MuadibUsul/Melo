"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Heart, Play, Repeat2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";
import { cn } from "@/lib/utils";

interface ShelfTrack {
  id: string;
  title: string;
  genre?: string | null;
  playCount: number;
  likeCount: number;
  audioUrl?: string;
  coverUrl?: string;
  durationMs?: number | null;
  creator: { displayName: string };
}

interface ShelfPlaylist {
  id: string;
  title: string;
}

const SAVED_SHELF_TRACKS_KEY = "melo.discover.shelfSavedTracks";

const curatedCollections = [
  { title: "适合 Remix 的歌", href: "/charts?view=remix", tone: "保留核心律动，换一个新的段落方向" },
  { title: "朋友聚会点歌", href: "/playlists/editor-picks", tone: "旋律直接、情绪明亮、适合连续播放" },
  { title: "不败浪漫", href: "/categories?genre=%E4%B8%AD%E6%96%87%E6%B5%81%E8%A1%8C", tone: "温柔人声、记忆点副歌和夜晚画面" },
  { title: "早晨通勤", href: "/playlists/weekend-drive", tone: "轻快节奏、干净音色和新的开始" },
  { title: "深夜兜风", href: "/playlists/midnight-rnb", tone: "低频、霓虹、松弛 R&B 和电子氛围" },
  { title: "电影公路", href: "/playlists/cinematic-journey", tone: "画面感配乐、长线情绪和开阔空间" },
];

function artworkUrl(id: string) {
  return `/api/melo-artwork/${encodeURIComponent(id)}`;
}

function readSavedTrackIds() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SAVED_SHELF_TRACKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    window.localStorage.removeItem(SAVED_SHELF_TRACKS_KEY);
    return [];
  }
}

function toPlayerTrack(track: ShelfTrack): PlayerTrack | null {
  if (!track.audioUrl) return null;
  return {
    id: track.id,
    title: track.title,
    artist: track.creator.displayName,
    audioUrl: track.audioUrl,
    coverUrl: track.coverUrl ?? artworkUrl(track.id),
    durationMs: track.durationMs ?? undefined,
  };
}

export function DiscoverShelves({
  hotTracks,
  newTracks,
  playlists,
}: {
  hotTracks: ShelfTrack[];
  newTracks: ShelfTrack[];
  playlists: ShelfPlaylist[];
}) {
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>(readSavedTrackIds);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const studioTracks = [...newTracks, ...hotTracks].filter((track) => track.genre !== "Lo-fi").slice(0, 6);
  const bestTracks = [...hotTracks].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6);

  function playShelf(title: string, tracks: ShelfTrack[], startIndex = 0) {
    const queue = tracks.map(toPlayerTrack).filter((track): track is PlayerTrack => Boolean(track));
    if (queue.length === 0) {
      toast("这一组暂时没有可播放音频", "error");
      return;
    }
    playQueue(queue, Math.min(startIndex, queue.length - 1), { title: `发现架 · ${title}`, href: "/discover" });
    setQueueOpen(true);
  }

  function toggleSave(track: ShelfTrack) {
    setSavedTrackIds((current) => {
      const saved = current.includes(track.id);
      const next = saved ? current.filter((id) => id !== track.id) : [...current, track.id];
      window.localStorage.setItem(SAVED_SHELF_TRACKS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("library-saved-updated"));
      toast(saved ? "已取消收藏" : "已收藏到发现架", "success");
      return next;
    });
  }

  async function shareTrack(track: ShelfTrack) {
    await navigator.clipboard?.writeText(`${window.location.origin}/tracks/${track.id}`).catch(() => null);
    toast("歌曲链接已复制", "success");
  }

  return (
    <section className="mb-6 space-y-6">
      <TrackShelf title="编辑精选" href="/charts" tracks={hotTracks.slice(0, 6)} onPlayShelf={playShelf} onSave={toggleSave} onShare={shareTrack} savedTrackIds={savedTrackIds} />
      <TrackShelf title="Studio 制作" href="/studio/editor" tracks={studioTracks} badge="Studio" onPlayShelf={playShelf} onSave={toggleSave} onShare={shareTrack} savedTrackIds={savedTrackIds} />
      <TrackShelf title="Melo v5.5 精选" href="/charts?model=v5.5" tracks={bestTracks} badge="v5.5" onPlayShelf={playShelf} onSave={toggleSave} onShare={shareTrack} savedTrackIds={savedTrackIds} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">主题集合</h2>
          <Link href="/library" className="inline-flex items-center gap-1 text-sm text-studio-gold">
            查看更多
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {curatedCollections.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45 hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item.title}</span>
                <span className="rounded bg-studio-gold/10 px-2 py-1 font-mono text-xs text-studio-gold">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </div>
              <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.tone}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-studio-gold">
                查看集合
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
        {playlists.length ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {playlists.slice(0, 4).map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="rounded-full border border-panel-border px-3 py-1.5 transition hover:border-studio-gold/45 hover:text-foreground">
                {playlist.title}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TrackShelf({
  title,
  href,
  tracks,
  badge,
  onPlayShelf,
  onSave,
  onShare,
  savedTrackIds,
}: {
  title: string;
  href: string;
  tracks: ShelfTrack[];
  badge?: string;
  onPlayShelf: (title: string, tracks: ShelfTrack[], startIndex?: number) => void;
  onSave: (track: ShelfTrack) => void;
  onShare: (track: ShelfTrack) => void;
  savedTrackIds: string[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon-sm" onClick={() => onPlayShelf(title, tracks)} aria-label={`播放${title}`} title={`播放${title}`}>
            <Play className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-studio-gold">
          See more
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {tracks.map((track, index) => {
          const saved = savedTrackIds.includes(track.id);
          return (
            <article
              key={`${title}-${track.id}`}
              className="group w-[220px] shrink-0 overflow-hidden rounded-lg border border-panel-border bg-black/20 transition hover:border-studio-gold/45 hover:bg-white/[0.03] sm:w-[260px]"
            >
              <div className="relative aspect-square overflow-hidden bg-black/30">
                <Image
                  src={track.coverUrl ?? artworkUrl(track.id)}
                  alt=""
                  fill
                  sizes="260px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-xs text-white/85 backdrop-blur">
                  {badge ?? track.genre ?? "Melo"}
                </span>
                <button
                  type="button"
                  onClick={() => onPlayShelf(title, tracks, index)}
                  className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-studio-gold backdrop-blur transition hover:border-studio-gold/45 hover:bg-black/75"
                  aria-label={`播放 ${track.title}`}
                >
                  <Play className="size-4" />
                </button>
              </div>
              <div className="p-3">
                <Link href={`/tracks/${track.id}`} className="block min-w-0">
                  <div className="truncate font-medium">{track.title}</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{track.creator.displayName}</div>
                </Link>
                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSave(track)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border border-panel-border bg-black/20 transition hover:border-studio-gold/45",
                      saved ? "text-studio-gold" : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={saved ? `取消收藏 ${track.title}` : `收藏 ${track.title}`}
                  >
                    <Heart className={cn("size-3.5", saved && "fill-current")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onShare(track)}
                    className="flex size-8 items-center justify-center rounded-lg border border-panel-border bg-black/20 text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                    aria-label={`分享 ${track.title}`}
                  >
                    <Share2 className="size-3.5" />
                  </button>
                  <Link
                    href={`/studio/pro?source=${track.id}&mode=remix&prompt=${encodeURIComponent(`Remix《${track.title}》，保留核心氛围，生成一个新的中文 AI 音乐版本`)}${track.genre ? `&genre=${encodeURIComponent(track.genre)}` : ""}`}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-panel-border bg-black/20 px-2 text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                  >
                    <Repeat2 className="size-3.5" />
                    Remix
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
