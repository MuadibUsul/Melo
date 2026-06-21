"use client";

import { useEffect, useState } from "react";
import { Flag, Heart, ListPlus, Play, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { isNetworkError } from "@/lib/fallback/catalog";
import { getPlaybackDeviceId } from "@/lib/player/device-id";
import { usePlayerStore } from "@/lib/player/use-player-store";

interface PlaylistView {
  id: string;
  title: string;
  tracks?: Array<{ trackId: string }>;
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
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistView[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("我喜欢的音乐");
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

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

  async function toggleLike() {
    try {
      const result = await api.post<{ liked: boolean }>(`/tracks/${id}/like`);
      setLiked(result.liked);
      toast(result.liked ? "已收藏" : "已取消收藏", "success");
    } catch (error) {
      if (isNetworkError(error)) {
        const next = !liked;
        setLiked(next);
        toast(next ? "已收藏" : "已取消收藏", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "操作失败", "error");
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
        const playlist = playlists[0] ?? { id: "local-liked", title: playlistTitle, tracks: [] };
        setPlaylists([playlist]);
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
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => null);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => null);
    toast("链接已复制", "success");
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
      {!saved ? (
        <div className="max-w-sm">
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
