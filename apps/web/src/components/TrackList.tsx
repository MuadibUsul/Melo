"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { getPlayableUrl, getTracksWithFallback, type CatalogTrack } from "@/lib/fallback/catalog";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "./ErrorAlert";

function toPlayerTrack(track: CatalogTrack, audioUrl: string): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.creator.displayName,
    audioUrl,
    durationMs: track.asset?.durationMs ?? undefined,
  };
}

export function TrackList({ genre, searchQuery }: { genre?: string; searchQuery?: string }) {
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
  const tracks = data?.items ?? [];
  const context = searchQuery
    ? { title: `搜索：${searchQuery}`, href: `/search?q=${encodeURIComponent(searchQuery)}` }
    : genre
      ? { title: genre, href: `/categories?genre=${encodeURIComponent(genre)}` }
      : { title: "曲库", href: "/library" };

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
              <Heart className="size-3" /> {track.likeCount}
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
