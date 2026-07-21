"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListMusic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";

const LOCAL_PLAYLISTS_KEY = "melo.library.localPlaylists";

interface LocalPlaylist {
  id: string;
  title: string;
  tracks: Array<{
    trackId: string;
    title: string;
    artist: string;
    audioUrl: string;
    durationMs?: number;
    addedAt: string;
  }>;
  updatedAt: string;
}

function readLocalPlaylists() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_PLAYLISTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as LocalPlaylist[]) : [];
  } catch {
    window.localStorage.removeItem(LOCAL_PLAYLISTS_KEY);
    return [];
  }
}

function toPlayerTrack(track: LocalPlaylist["tracks"][number]): PlayerTrack {
  return {
    id: track.trackId,
    title: track.title,
    artist: track.artist,
    audioUrl: track.audioUrl,
    durationMs: track.durationMs,
  };
}

export function LocalPlaylistsPanel() {
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>(() => readLocalPlaylists());
  const playQueue = usePlayerStore((state) => state.playQueue);

  useEffect(() => {
    const refresh = () => setPlaylists(readLocalPlaylists());
    window.addEventListener("storage", refresh);
    window.addEventListener("library-playlists-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("library-playlists-updated", refresh);
    };
  }, []);

  if (playlists.length === 0) {
    return (
      <div className="studio-surface rounded-lg p-5 text-sm text-muted-foreground">
        还没有本地歌单。打开任意歌曲详情，点击“加入歌单”即可保存到这里。
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {playlists.map((playlist) => (
        <article key={playlist.id} className="studio-surface rounded-lg p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <ListMusic className="size-3.5 text-studio-gold" />
                本地歌单
              </div>
              <h3 className="mt-2 text-lg font-semibold">{playlist.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{playlist.tracks.length} 首歌曲</p>
            </div>
            <Button
              variant="outline"
              onClick={() => playQueue(playlist.tracks.map(toPlayerTrack), 0, { title: `本地歌单 · ${playlist.title}`, href: "/library?view=playlists" })}
              disabled={playlist.tracks.length === 0}
            >
              <Play className="size-4" />
              播放歌单
            </Button>
          </div>
          <div className="mt-4 divide-y divide-panel-border/60">
            {playlist.tracks.map((track, index) => (
              <Link
                key={`${playlist.id}-${track.trackId}`}
                href={`/tracks/${track.trackId}`}
                className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3 transition hover:text-studio-gold"
              >
                <span className="text-center font-mono text-xs text-muted-foreground">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{track.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{track.artist}</span>
                </span>
              </Link>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
