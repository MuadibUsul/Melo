"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, Play, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getChartWithFallback, getPlayableUrl, type CatalogTrack } from "@/lib/fallback/catalog";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";
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

export function ChartList({ type }: { type: "hot" | "new" }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["chart", type],
    queryFn: () => getChartWithFallback(type),
    refetchInterval: 60_000,
  });

  const player = usePlayerStore();

  if (isError) return <ErrorAlert onRetry={() => refetch()} />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tracks = data?.items ?? [];
  const context = {
    title: type === "hot" ? "热门榜单" : "最新发布",
    href: "/charts",
  };

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {type === "hot" ? (
          <TrendingUp className="size-4 text-studio-gold" />
        ) : (
          <Clock className="size-4 text-meter-green" />
        )}
        {context.title}
      </div>
      {tracks.length === 0 ? (
        <div className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm text-muted-foreground">暂无作品</div>
      ) : (
        tracks.slice(0, 10).map((track, index) => (
          <div key={track.id} className="flex items-center gap-3 rounded px-2 py-2 transition hover:bg-studio-gold/5">
            <span className="w-6 text-center font-mono text-sm tabular-nums text-muted-foreground">
              {track.rank ?? index + 1}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={async () => {
                const visibleTracks = tracks.slice(0, 10);
                const queueUrls = await Promise.all(visibleTracks.map((item) => getPlayableUrl(item)));
                const queue = visibleTracks.map((item, queueIndex) =>
                  toPlayerTrack(item, queueUrls[queueIndex] || item.audioUrl || ""),
                );
                player.playQueue(queue, index, context);
              }}
            >
              <Play className="size-3" />
            </Button>
            <div className="min-w-0 flex-1">
              <Link href={`/tracks/${track.id}`} className="truncate text-sm transition-colors hover:text-studio-gold">
                {track.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{track.creator.displayName}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
