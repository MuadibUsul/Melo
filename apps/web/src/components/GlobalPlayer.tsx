"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Disc3, Heart, ListMusic, Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlaybackDeviceId } from "@/lib/player/device-id";
import { usePlayerStore, type PlayMode } from "@/lib/player/use-player-store";

export function GlobalPlayer() {
  const store = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playReportedRef = useRef<string | null>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    playMode,
    queue,
    queueIndex,
    contextTitle,
    contextHref,
    isQueueOpen,
  } = store;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

  const reportPlay = useCallback(
    (trackId: string, msPlayed: number, completed: boolean) => {
      const deviceId = getPlaybackDeviceId();
      fetch(`${apiBase}/tracks/${trackId}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          msPlayed,
          completed,
          source: contextTitle ?? "web-player",
        }),
      })
        .then(() => window.dispatchEvent(new Event("recent-listening-updated")))
        .catch(() => null);
    },
    [apiBase, contextTitle],
  );

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    const audio = audioRef.current;
    const onTimeUpdate = () => store.setTime(audio.currentTime);
    const onDurationChange = () => store.setDuration(audio.duration);
    const onEnded = () => {
      if (currentTrack?.id) {
        reportPlay(currentTrack.id, Math.round(audio.currentTime * 1000), true);
      }
      store.next();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack?.id, reportPlay, store]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
      playReportedRef.current = null;
    }
    if (isPlaying) audio.play().catch(() => null);
    else audio.pause();
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!currentTrack?.id) return;
    playReportedRef.current = null;
    const timer = window.setTimeout(() => {
      if (playReportedRef.current === currentTrack.id) return;
      playReportedRef.current = currentTrack.id;
      reportPlay(currentTrack.id, 15000, false);
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [currentTrack?.id, reportPlay]);

  const handleSeek = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextTime = parseFloat(event.target.value);
      store.setTime(nextTime);
      if (audioRef.current) audioRef.current.currentTime = nextTime;
    },
    [store],
  );

  const handleVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      store.setVolume(parseFloat(event.target.value));
    },
    [store],
  );

  const modeLabels: Record<PlayMode, string> = {
    sequential: "顺序播放",
    random: "随机播放",
    single: "单曲循环",
  };
  const upcoming = queue.filter((_, index) => index !== queueIndex);

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-panel-border bg-black/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 sm:flex sm:px-4">
          <div className="flex min-w-0 items-center gap-3 sm:w-72">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-studio-gold/15">
              {currentTrack.coverUrl ? (
                <Image src={currentTrack.coverUrl} alt="" width={44} height={44} className="size-full rounded-lg object-cover" />
              ) : (
                <Disc3 className="size-5 text-studio-gold" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/tracks/${currentTrack.id}`} className="block truncate text-sm font-medium leading-tight hover:text-studio-gold">
                {currentTrack.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
              {contextTitle ? (
                contextHref ? (
                  <Link href={contextHref} className="block truncate text-[11px] text-muted-foreground hover:text-foreground">
                    {contextTitle}
                  </Link>
                ) : (
                  <p className="truncate text-[11px] text-muted-foreground">{contextTitle}</p>
                )
              ) : null}
            </div>
            <Button variant="ghost" size="icon-sm" className="hidden shrink-0 sm:inline-flex">
              <Heart className="size-4" />
            </Button>
          </div>

          <div className="col-span-2 flex flex-1 flex-col items-center gap-0.5 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={store.prev}>
                <SkipBack className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={store.togglePlay}
                className="size-9 rounded-full border border-studio-gold/30 hover:bg-studio-gold/10"
              >
                {isPlaying ? <Pause className="size-4 text-studio-gold" /> : <Play className="size-4 text-studio-gold" />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={store.next}>
                <SkipForward className="size-4" />
              </Button>
              <Button
                variant={isQueueOpen ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => store.setQueueOpen(!isQueueOpen)}
                className="sm:hidden"
                title="播放队列"
              >
                <ListMusic className="size-4" />
              </Button>
            </div>
            <div className="flex w-full max-w-lg items-center gap-2">
              <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={store.duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="h-1 flex-1 accent-studio-gold"
              />
              <span className="w-10 text-[11px] tabular-nums text-muted-foreground">{formatTime(store.duration)}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{queue.length > 0 ? `${queueIndex + 1} / ${queue.length}` : null}</div>
          </div>

          <div className="hidden w-52 items-center justify-end gap-2 sm:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                const modes: PlayMode[] = ["sequential", "random", "single"];
                const index = modes.indexOf(playMode);
                store.setPlayMode(modes[(index + 1) % 3]!);
              }}
              title={modeLabels[playMode]}
            >
              <ListMusic className="size-4" />
            </Button>
            <Button variant={isQueueOpen ? "secondary" : "ghost"} size="icon-sm" onClick={() => store.setQueueOpen(!isQueueOpen)} title="播放队列">
              <ListMusic className="size-4" />
            </Button>
            <Volume2 className="size-4 text-muted-foreground" />
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={handleVolumeChange} className="h-1 w-20 accent-studio-gold" />
          </div>
        </div>
      </div>

      {isQueueOpen ? (
        <aside className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-panel-border bg-[#111317] shadow-2xl sm:w-80">
          <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">播放队列</div>
              {contextTitle ? <div className="text-xs text-muted-foreground">{contextTitle}</div> : null}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => store.setQueueOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            <div className="mb-3 rounded-lg border border-studio-gold/25 bg-studio-gold/8 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">当前播放</div>
              <div className="mt-2 text-sm font-medium">{currentTrack.title}</div>
              <div className="text-xs text-muted-foreground">{currentTrack.artist}</div>
            </div>
            {upcoming[0] ? (
              <div className="mb-3 rounded-lg border border-panel-border bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">下一首</div>
                <div className="mt-2 text-sm font-medium">{upcoming[0].title}</div>
                <div className="text-xs text-muted-foreground">{upcoming[0].artist}</div>
              </div>
            ) : null}
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <div className="rounded-lg border border-panel-border bg-black/20 p-3 text-sm text-muted-foreground">没有更多曲目</div>
              ) : (
                upcoming.map((track, index) => {
                  const absoluteIndex = queueIndex + index + 1;
                  if (absoluteIndex >= queue.length) return null;
                  return (
                    <button
                      key={`${track.id}-${absoluteIndex}`}
                      className="flex w-full items-center gap-3 rounded-lg border border-panel-border bg-black/20 p-3 text-left transition hover:border-studio-gold/45"
                      onClick={() => store.jumpToQueueIndex(absoluteIndex)}
                    >
                      <div className="flex size-9 items-center justify-center rounded bg-studio-gold/10 text-studio-gold">
                        <Disc3 className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{track.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
