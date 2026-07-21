"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Library, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocalDemoPublishedTracks, type LocalDemoPublishedTrack } from "@/lib/local-demo-generation";
import { usePlayerStore } from "@/lib/player/use-player-store";

function matchesQuery(track: LocalDemoPublishedTrack, query?: string) {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return true;
  return [track.title, track.genre, track.visibility, "本地演示", "我的创作"].some((value) =>
    value.toLowerCase().includes(normalized),
  );
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function LocalPublishedTracksShelf({
  query,
  title = "我的发布作品",
  limit = 4,
}: {
  query?: string;
  title?: string;
  limit?: number;
}) {
  const player = usePlayerStore();
  const [tracks, setTracks] = useState<LocalDemoPublishedTrack[]>([]);

  useEffect(() => {
    function refresh() {
      setTracks(getLocalDemoPublishedTracks());
    }

    refresh();
    window.addEventListener("tracks-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("tracks-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const visibleTracks = useMemo(
    () => tracks.filter((track) => matchesQuery(track, query)).slice(0, limit),
    [limit, query, tracks],
  );

  if (visibleTracks.length === 0) return null;

  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Library className="size-5 text-studio-gold" />
        {title}
      </div>
      <div className="space-y-2">
        {visibleTracks.map((track) => (
          <div key={track.id} className="rounded-lg border border-panel-border bg-black/20 p-3">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`播放 ${track.title}`}
                onClick={() =>
                  player.playQueue(
                    [
                      {
                        id: track.id,
                        title: track.title,
                        artist: "我的创作",
                        audioUrl: track.audioUrl,
                        durationMs: track.durationMs,
                      },
                    ],
                    0,
                    { title: "我的发布作品", href: "/library?view=created" },
                  )
                }
              >
                <Play className="size-4 text-studio-gold" />
              </Button>
              <div className="min-w-0 flex-1">
                <Link href={`/tracks/${track.id}`} className="block truncate text-sm font-medium hover:text-studio-gold">
                  {track.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{track.genre}</span>
                  <span>{formatDuration(track.durationMs)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    本地演示
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {track.visibility === "public" ? "公开" : "仅链接可见"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
