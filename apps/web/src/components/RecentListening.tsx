"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Clock3, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getPlaybackDeviceId } from "@/lib/player/device-id";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";
import { Button } from "@/components/ui/button";

interface RecentTrack {
  id: string;
  title: string;
  genre?: string | null;
  playCount: number;
  likeCount: number;
  creator: { id: string; displayName: string };
  asset?: { streamKey?: string | null; storageKey?: string | null; durationMs?: number | null };
}

function toPlayerTrack(track: RecentTrack): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.creator.displayName,
    audioUrl: track.asset?.streamKey || track.asset?.storageKey || "",
    durationMs: track.asset?.durationMs ?? undefined,
  };
}

export function RecentListening() {
  const player = usePlayerStore();
  const deviceId = useMemo(() => getPlaybackDeviceId(), []);

  const { data, refetch } = useQuery({
    queryKey: ["recent-listening", deviceId],
    queryFn: () => api.get<{ items: RecentTrack[] }>(`/listening/recent?deviceId=${encodeURIComponent(deviceId)}&limit=6`),
    enabled: Boolean(deviceId),
    retry: 0,
  });

  useEffect(() => {
    const listener = () => refetch();
    window.addEventListener("recent-listening-updated", listener);
    return () => window.removeEventListener("recent-listening-updated", listener);
  }, [refetch]);

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Clock3 className="size-5 text-studio-gold" />
        最近收听
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((track, index) => (
          <div key={track.id} className="studio-surface rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/tracks/${track.id}`} className="block truncate text-sm font-medium hover:text-studio-gold">
                  {track.title}
                </Link>
                <div className="mt-1 truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => player.playQueue(items.map(toPlayerTrack), index, { title: "最近收听", href: "/" })}
                title={`播放 ${track.title}`}
              >
                <Play className="size-4 text-studio-gold" />
              </Button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              播放 {track.playCount.toLocaleString("zh-CN")} / 收藏 {track.likeCount.toLocaleString("zh-CN")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
