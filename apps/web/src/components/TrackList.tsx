"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlayableUrl, getTracksWithFallback, type CatalogTrack } from "@/lib/fallback/catalog";
import { getLocalDemoPublishedTracks } from "@/lib/local-demo-generation";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";
import { ErrorAlert } from "./ErrorAlert";

const DISCOVER_SAVED_TRACKS_KEY = "melo.discover.savedTracks";
const SHELF_SAVED_TRACKS_KEY = "melo.discover.shelfSavedTracks";

function readSavedTrackIds() {
  if (typeof window === "undefined") return [];
  const ids = new Set<string>();
  for (const key of [DISCOVER_SAVED_TRACKS_KEY, SHELF_SAVED_TRACKS_KEY]) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (typeof item === "string") ids.add(item);
        });
      }
    } catch {
      window.localStorage.removeItem(key);
    }
  }
  return [...ids];
}

function toPlayerTrack(track: CatalogTrack, audioUrl: string): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.creator.displayName,
    audioUrl,
    durationMs: track.asset?.durationMs ?? undefined,
  };
}

export function TrackList({ genre, searchQuery, likedOnly = false }: { genre?: string; searchQuery?: string; likedOnly?: boolean }) {
  const [localTracks, setLocalTracks] = useState<CatalogTrack[]>([]);
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>(() => readSavedTrackIds());
  const endpoint = searchQuery
    ? `/tracks/search?q=${encodeURIComponent(searchQuery)}`
    : genre
      ? `/tracks?genre=${encodeURIComponent(genre)}`
      : "/tracks";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tracks", genre, searchQuery],
    queryFn: () => getTracksWithFallback(endpoint),
  });

  const player = usePlayerStore();
  useEffect(() => {
    function refreshLocalTracks() {
      const published = getLocalDemoPublishedTracks();
      setLocalTracks(
        published.map((track, index) => ({
          id: track.id,
          title: track.title,
          genre: track.genre,
          tags: ["本地演示", track.visibility === "public" ? "公开" : "仅链接可见"],
          playCount: 0,
          likeCount: 0,
          rank: index + 1,
          score: 1000 - index,
          audioUrl: track.audioUrl,
          creator: { id: "demo-local-user", displayName: "我的创作", avatarKey: null },
          asset: { id: track.assetId, storageKey: track.audioUrl, durationMs: track.durationMs },
          publishedAt: track.createdAt,
        })),
      );
    }

    refreshLocalTracks();
    const refreshSavedTracks = () => setSavedTrackIds(readSavedTrackIds());
    window.addEventListener("tracks-updated", refreshLocalTracks);
    window.addEventListener("storage", refreshLocalTracks);
    window.addEventListener("storage", refreshSavedTracks);
    window.addEventListener("library-saved-updated", refreshSavedTracks);
    return () => {
      window.removeEventListener("tracks-updated", refreshLocalTracks);
      window.removeEventListener("storage", refreshLocalTracks);
      window.removeEventListener("storage", refreshSavedTracks);
      window.removeEventListener("library-saved-updated", refreshSavedTracks);
    };
  }, []);

  const tracks = useMemo(() => {
    const remoteTracks = data?.items ?? [];
    const query = searchQuery?.trim().toLowerCase();
    const saved = new Set(savedTrackIds);
    return [...localTracks, ...remoteTracks].filter((track) => {
      if (likedOnly && !saved.has(track.id)) return false;
      if (genre && track.genre !== genre) return false;
      if (!query) return true;
      return [track.title, track.genre, track.creator.displayName, ...track.tags]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [data?.items, genre, likedOnly, localTracks, savedTrackIds, searchQuery]);
  const context = searchQuery
    ? { title: `搜索：${searchQuery}`, href: `/search?q=${encodeURIComponent(searchQuery)}` }
    : genre
      ? { title: genre, href: `/categories?genre=${encodeURIComponent(genre)}` }
      : { title: "音乐库", href: "/library" };

  if (isError) return <ErrorAlert onRetry={() => refetch()} />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">{searchQuery ? "没有找到匹配的作品" : "暂无作品"}</div>;
  }

  return (
    <div className="studio-surface overflow-hidden rounded-lg">
      <div className="hidden grid-cols-[56px_minmax(0,1.6fr)_minmax(0,0.8fr)_96px_96px] gap-4 border-b border-panel-border px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted-foreground md:grid">
        <div>#</div>
        <div>标题</div>
        <div>标签</div>
        <div>收藏</div>
        <div className="text-right">时长</div>
      </div>
      <div className="divide-y divide-panel-border/60">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 transition hover:bg-white/5 md:grid-cols-[56px_minmax(0,1.6fr)_minmax(0,0.8fr)_96px_96px] md:gap-4"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center text-sm text-muted-foreground">{index + 1}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`播放 ${track.title}`}
                onClick={async () => {
                  const queueUrls = await Promise.all(tracks.map((item) => getPlayableUrl(item)));
                  const queue = tracks.map((item, queueIndex) =>
                    toPlayerTrack(item, queueUrls[queueIndex] || item.audioUrl || ""),
                  );
                  player.playQueue(queue, index, context);
                }}
              >
                <Play className="size-4 text-studio-gold" />
              </Button>
            </div>

            <div className="min-w-0">
              <Link
                href={`/tracks/${track.id}`}
                className="truncate text-sm font-medium transition-colors hover:text-studio-gold"
              >
                {track.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{track.creator.displayName}</p>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {track.genre ? <Badge variant="secondary">{track.genre}</Badge> : null}
              {track.tags.slice(0, 1).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground md:text-sm">
              <Heart className="size-3" /> {track.likeCount.toLocaleString("zh-CN")}
            </div>

            <div className="text-right text-xs text-muted-foreground md:text-sm">{formatDuration(track.asset?.durationMs)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs) return "--:--";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
