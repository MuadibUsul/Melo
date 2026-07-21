"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Code2,
  Copy,
  Download,
  FileAudio,
  Flag,
  Heart,
  ListPlus,
  Mic2,
  PencilLine,
  Play,
  Repeat2,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { isNetworkError } from "@/lib/fallback/catalog";
import { getPlaybackDeviceId } from "@/lib/player/device-id";
import { usePlayerStore } from "@/lib/player/use-player-store";

const DISCOVER_SAVED_TRACKS_KEY = "melo.discover.savedTracks";
const LOCAL_PLAYLISTS_KEY = "melo.library.localPlaylists";

function readSavedTrackIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DISCOVER_SAVED_TRACKS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    window.localStorage.removeItem(DISCOVER_SAVED_TRACKS_KEY);
    return [];
  }
}

function writeSavedTrackId(id: string, saved: boolean) {
  const current = readSavedTrackIds();
  const next = saved ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id);
  window.localStorage.setItem(DISCOVER_SAVED_TRACKS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("library-saved-updated"));
}

interface PlaylistView {
  id: string;
  title: string;
  tracks?: Array<{ trackId: string }>;
}

interface LocalPlaylistView {
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
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_PLAYLISTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as LocalPlaylistView[]) : [];
  } catch {
    window.localStorage.removeItem(LOCAL_PLAYLISTS_KEY);
    return [];
  }
}

function writeLocalPlaylists(playlists: LocalPlaylistView[]) {
  window.localStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event("library-playlists-updated"));
}

export function TrackDetailActions({
  id,
  title,
  artist,
  audioUrl,
  durationMs,
}: {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  durationMs?: number;
}) {
  const player = usePlayerStore();
  const [liked, setLiked] = useState(() => (typeof window === "undefined" ? false : readSavedTrackIds().includes(id)));
  const [saved, setSaved] = useState(() =>
    typeof window === "undefined" ? false : readLocalPlaylists().some((playlist) => playlist.tracks.some((track) => track.trackId === id)),
  );
  const [playlists, setPlaylists] = useState<PlaylistView[]>(() => readLocalPlaylists());
  const [playlistTitle, setPlaylistTitle] = useState("我喜欢的音乐");
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const remixPrompt = useMemo(() => encodeURIComponent(`基于《${title}》做一个新的中文版本`), [title]);

  const publicPath = `/song/${encodeURIComponent(id)}`;
  const embedPath = `/embed/${encodeURIComponent(id)}`;
  const remixPath = `/studio/simple?prompt=${remixPrompt}`;

  async function copyText(value: string, message: string) {
    await navigator.clipboard?.writeText(value).catch(() => null);
    toast(message, "success");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api
        .get<PlaylistView[]>("/playlists")
        .then((items) => {
          setPlaylists(items);
          setSaved(items.some((playlist) => playlist.tracks?.some((track) => track.trackId === id)));
        })
        .catch(() => null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  function addToLocalPlaylist() {
    const current = readLocalPlaylists();
    const now = new Date().toISOString();
    const fallbackPlaylist: LocalPlaylistView = {
      id: "local-liked",
      title: playlistTitle.trim() || "我喜欢的音乐",
      tracks: [],
      updatedAt: now,
    };
    const playlist = current[0] ?? fallbackPlaylist;
    const tracks = playlist.tracks.some((track) => track.trackId === id)
      ? playlist.tracks
      : [{ trackId: id, title, artist, audioUrl, durationMs, addedAt: now }, ...playlist.tracks];
    const nextPlaylist = { ...playlist, tracks, updatedAt: now };
    const next = current[0] ? [nextPlaylist, ...current.slice(1)] : [nextPlaylist];
    writeLocalPlaylists(next);
    setPlaylists(next);
  }

  function removeFromLocalPlaylist() {
    const now = new Date().toISOString();
    const next = readLocalPlaylists()
      .map((playlist) => ({
        ...playlist,
        tracks: playlist.tracks.filter((track) => track.trackId !== id),
        updatedAt: now,
      }))
      .filter((playlist) => playlist.tracks.length > 0);
    writeLocalPlaylists(next);
    setPlaylists(next);
  }

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    writeSavedTrackId(id, next);
    try {
      await api.post<{ liked: boolean }>(`/tracks/${id}/like`);
      toast(next ? "已收藏" : "已取消收藏", "success");
    } catch (error) {
      if (isNetworkError(error)) {
        toast(next ? "已收藏" : "已取消收藏", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "已在本地更新收藏状态", "info");
    }
  }

  async function saveToPlaylist() {
    setBusy("playlist");
    try {
      let playlist = playlists[0];
      if (!playlist) {
        playlist = await api.post<PlaylistView>("/playlists", { title: playlistTitle, isPublic: false });
      }
      await api.post(`/playlists/${playlist.id}/tracks`, { trackId: id });
      setSaved(true);
      const latest = await api.get<PlaylistView[]>("/playlists").catch(() => playlists);
      setPlaylists(latest);
      toast("已加入歌单", "success");
    } catch (error) {
      if (isNetworkError(error)) {
        addToLocalPlaylist();
        setSaved(true);
        toast("已加入歌单", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "加入歌单失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function removeFromPlaylist() {
    const playlist = playlists.find((item) => item.tracks?.some((track) => track.trackId === id)) ?? playlists[0];
    if (!playlist) return;
    setBusy("playlist");
    try {
      await api.delete(`/playlists/${playlist.id}/tracks/${id}`);
      const latest = await api.get<PlaylistView[]>("/playlists").catch(() => playlists);
      setPlaylists(latest);
      setSaved(false);
      toast("已移出歌单", "success");
    } catch (error) {
      if (isNetworkError(error)) {
        removeFromLocalPlaylist();
        setSaved(false);
        toast("已移出歌单", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "移出歌单失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function report() {
    const reason = reportReason.trim();
    if (!reason) {
      toast("请填写举报原因", "error");
      return;
    }
    setBusy("report");
    try {
      await api.post(`/tracks/${id}/report`, { reason });
      setReportReason("");
      toast("举报已提交", "success");
    } catch (error) {
      if (isNetworkError(error)) {
        setReportReason("");
        toast("举报已提交", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "提交举报失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const url = new URL(publicPath, window.location.origin).toString();
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => null);
      return;
    }
    await copyText(url, "链接已复制");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            player.play({ id, title, artist, audioUrl, durationMs });
            api
              .post(`/tracks/${id}/play`, {
                deviceId: getPlaybackDeviceId(),
                msPlayed: 3000,
                completed: false,
                source: "track-detail",
              })
              .then(() => window.dispatchEvent(new Event("recent-listening-updated")))
              .catch(() => null);
          }}
          size="lg"
          disabled={!audioUrl}
        >
          <Play className="size-4" />
          播放
        </Button>
        <Button variant={liked ? "secondary" : "outline"} size="lg" onClick={toggleLike}>
          <Heart className="size-4" />
          {liked ? "已收藏" : "收藏"}
        </Button>
        <Button
          variant={saved ? "secondary" : "outline"}
          size="lg"
          onClick={saved ? removeFromPlaylist : saveToPlaylist}
          disabled={busy === "playlist"}
        >
          {saved ? <Trash2 className="size-4" /> : <ListPlus className="size-4" />}
          {saved ? "移出歌单" : "加入歌单"}
        </Button>
        <Button variant="outline" size="lg" onClick={share}>
          <Share2 className="size-4" />
          分享
        </Button>
      </div>

      <section className="rounded-lg border border-panel-border bg-black/20 p-4">
        <div className="text-sm font-semibold text-foreground">公开分享</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          复制歌曲短链、嵌入播放器，或把这首歌作为 Remix 起点。
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Button variant="outline" onClick={() => void copyText(new URL(publicPath, window.location.origin).toString(), "歌曲链接已复制")}>
            <Copy className="size-4" />
            复制链接
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void copyText(
                `<iframe title="${title} - Melo" src="${new URL(embedPath, window.location.origin).toString()}" width="100%" height="180" loading="lazy"></iframe>`,
                "嵌入代码已复制",
              )
            }
          >
            <Code2 className="size-4" />
            复制嵌入
          </Button>
          <Button variant="outline" onClick={() => void copyText(new URL(remixPath, window.location.origin).toString(), "Remix 入口已复制")}>
            <Sparkles className="size-4" />
            复制 Remix
          </Button>
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button asChild variant="secondary">
          <Link href={`/studio/pro?source=${encodeURIComponent(id)}&mode=cover`}>
            <Mic2 className="size-4" />
            翻唱
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/studio/pro?source=${encodeURIComponent(id)}&mode=extend`}>
            <Repeat2 className="size-4" />
            延展
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={remixPath}>
            <Sparkles className="size-4" />
            Remix
          </Link>
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button asChild variant="outline">
          <Link href={`/studio/editor?source=${encodeURIComponent(id)}`}>
            <PencilLine className="size-4" />
            打开编辑器
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/studio/editor?source=${encodeURIComponent(id)}&panel=stems`}>
            <FileAudio className="size-4" />
            分轨导出
          </Link>
        </Button>
        {audioUrl ? (
          <Button asChild variant="outline">
            <a href={audioUrl} download>
              <Download className="size-4" />
              下载音频
            </a>
          </Button>
        ) : null}
      </div>

      {!saved ? (
        <div className="w-full max-w-sm">
          <Input value={playlistTitle} onChange={(event) => setPlaylistTitle(event.target.value)} aria-label="歌单名称" />
        </div>
      ) : null}

      <div className="flex max-w-xl flex-col gap-2 sm:flex-row">
        <Input value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder="举报原因" />
        <Button variant="outline" onClick={report} disabled={busy === "report"}>
          <Flag className="size-4" />
          举报
        </Button>
      </div>
    </div>
  );
}
