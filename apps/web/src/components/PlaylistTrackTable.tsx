"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";

interface PlaylistTrackRow {
  id: string;
  title: string;
  genre?: string | null;
  artist: string;
  audioUrl: string;
  durationMs?: number | null;
  playCount?: number;
  likeCount?: number;
}

function toPlayerTrack(track: PlaylistTrackRow): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    audioUrl: track.audioUrl,
    durationMs: track.durationMs ?? undefined,
  };
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs) return "--:--";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PlaylistTrackTable({
  title,
  href,
  tracks,
}: {
  title: string;
  href?: string;
  tracks: PlaylistTrackRow[];
}) {
  const player = usePlayerStore();
  const queue = tracks.map(toPlayerTrack);

  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Track List</div>
          <div className="mt-2 text-lg font-semibold">{tracks.length} 首曲目</div>
        </div>
        <Button
          size="lg"
          onClick={() => {
            player.playQueue(queue, 0, { title, href: href ?? null });
          }}
          disabled={queue.length === 0}
        >
          <Play className="size-4" />
          播放全部
        </Button>
      </div>

      <div className="hidden grid-cols-[48px_minmax(0,1.5fr)_minmax(0,0.8fr)_120px_88px] gap-4 border-b border-panel-border px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground md:grid">
        <div>#</div>
        <div>标题</div>
        <div>风格</div>
        <div>播放</div>
        <div className="text-right">时长</div>
      </div>

      <div className="divide-y divide-panel-border/60">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="grid grid-cols-[auto_1fr] items-center gap-3 px-3 py-3 transition hover:bg-white/5 md:grid-cols-[48px_minmax(0,1.5fr)_minmax(0,0.8fr)_120px_88px] md:gap-4"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center text-sm text-muted-foreground">{index + 1}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => player.playQueue(queue, index, { title, href: href ?? null })}
              >
                <Play className="size-3" />
              </Button>
            </div>

            <div className="min-w-0">
              <Link href={`/tracks/${track.id}`} className="truncate text-sm font-medium hover:text-studio-gold">
                {track.title}
              </Link>
              <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
            </div>

            <div className="hidden truncate text-sm text-muted-foreground md:block">{track.genre || "未分类"}</div>

            <div className="hidden text-sm text-muted-foreground md:block">
              {(track.playCount ?? 0).toLocaleString()}
            </div>

            <div className="text-right text-sm text-muted-foreground">{formatDuration(track.durationMs)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
