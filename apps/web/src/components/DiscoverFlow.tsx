"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Award,
  Copy,
  ExternalLink,
  Flag,
  Flame,
  Heart,
  Check,
  Library,
  ListMusic,
  MoreHorizontal,
  Play,
  Radio,
  Repeat2,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";
import { cn } from "@/lib/utils";

export interface DiscoverFlowTrack {
  id: string;
  title: string;
  genre?: string | null;
  playCount: number;
  likeCount: number;
  audioUrl?: string;
  coverUrl?: string;
  durationMs?: number | null;
  creator: { displayName: string };
}

export interface DiscoverFlowPlaylist {
  id: string;
  title: string;
  owner?: { displayName: string };
  tracks: Array<{ track: { id: string; title: string } }>;
}

const tabs = [
  { key: "for-you", label: "为你推荐", icon: Sparkles },
  { key: "hot", label: "热播", icon: Flame },
  { key: "new", label: "新歌", icon: Radio },
  { key: "playlists", label: "歌单", icon: ListMusic },
  { key: "challenge", label: "挑战", icon: Trophy },
] as const;

type TabKey = (typeof tabs)[number]["key"];
const genreFilters = ["全部", "中文流行", "国风", "R&B", "电子", "Lo-fi", "影视配乐"] as const;
type GenreFilter = (typeof genreFilters)[number];
const SAVED_TRACKS_KEY = "melo.discover.savedTracks";
const SAVED_PLAYLISTS_KEY = "melo.discover.savedPlaylists";
const challengeCards = [
  {
    title: "夏夜来信",
    status: "本周主题",
    brief: "写一首像夜风里收到一封信的歌，可以是中文流行、国风或 R&B。",
    prompt: "夏夜来信主题，中文歌词，女声，副歌有记忆点，温柔但带一点遗憾",
    prize: "编辑推荐位",
  },
  {
    title: "一分钟副歌",
    status: "Remix 赛道",
    brief: "保留一首热门歌的核心律动，重新生成一个更抓耳的副歌段落。",
    prompt: "一分钟副歌挑战，强记忆点 hook，节奏明亮，适合短视频循环",
    prize: "Remix 榜单曝光",
  },
  {
    title: "电影公路",
    status: "创作者征集",
    brief: "做一段可以配在旅行、告别或重逢画面里的中文 AI 音乐。",
    prompt: "电影公路主题，宽阔鼓组，温暖钢琴，中文女声，画面感强",
    prize: "主题集合收录",
  },
] as const;

function artworkUrl(id: string) {
  return `/api/melo-artwork/${encodeURIComponent(id)}`;
}

function readSavedTrackIds() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SAVED_TRACKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    window.localStorage.removeItem(SAVED_TRACKS_KEY);
    return [];
  }
}

function readSavedPlaylistIds() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SAVED_PLAYLISTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    window.localStorage.removeItem(SAVED_PLAYLISTS_KEY);
    return [];
  }
}

const promptByTab: Record<TabKey, string> = {
  "for-you": "写一首适合夜晚散步的中文流行歌，女声，温暖但有一点遗憾",
  hot: "写一首有强烈副歌记忆点的中文热播单曲，节奏明亮",
  new: "写一首新鲜感很强的 AI 流行歌，带一点电子和弦乐",
  playlists: "根据编辑精选歌单的氛围，生成一首适合连续播放的新歌",
  challenge: "夏夜来信主题，中文歌词，温柔女声，副歌适合合唱",
};

function toPlayerTrack(track: DiscoverFlowTrack): PlayerTrack | null {
  if (!track.audioUrl) return null;
  return {
    id: track.id,
    title: track.title,
    artist: track.creator.displayName,
    audioUrl: track.audioUrl,
    coverUrl: track.coverUrl ?? artworkUrl(track.id),
    durationMs: track.durationMs ?? undefined,
  };
}

export function DiscoverFlow({
  hotTracks,
  newTracks,
  playlists,
}: {
  hotTracks: DiscoverFlowTrack[];
  newTracks: DiscoverFlowTrack[];
  playlists: DiscoverFlowPlaylist[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("for-you");
  const [activeGenre, setActiveGenre] = useState<GenreFilter>("全部");
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>(readSavedTrackIds);
  const [savedPlaylistIds, setSavedPlaylistIds] = useState<string[]>(readSavedPlaylistIds);
  const [openMoreTrackId, setOpenMoreTrackId] = useState<string | null>(null);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const activeLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? "发现";

  const baseTracks = useMemo(() => {
    if (activeTab === "new") return newTracks;
    if (activeTab === "challenge") return [...newTracks, ...hotTracks].filter((track) => track.genre !== "Lo-fi").slice(0, 8);
    return hotTracks;
  }, [activeTab, hotTracks, newTracks]);

  const tracks = useMemo(() => {
    if (activeGenre === "全部") return baseTracks;
    return baseTracks.filter((track) => track.genre === activeGenre);
  }, [activeGenre, baseTracks]);

  const visiblePlaylists = useMemo(() => {
    if (activeGenre === "全部") return playlists;
    return playlists.filter((playlist) => playlist.tracks.some((item) => hotTracks.some((track) => track.id === item.track.id && track.genre === activeGenre)));
  }, [activeGenre, hotTracks, playlists]);
  const trackById = useMemo(() => {
    const map = new Map<string, DiscoverFlowTrack>();
    [...hotTracks, ...newTracks].forEach((track) => map.set(track.id, track));
    return map;
  }, [hotTracks, newTracks]);

  const activePrompt =
    activeGenre === "全部"
      ? promptByTab[activeTab]
      : `写一首${activeGenre}风格的中文 AI 音乐，参考${activeLabel}里的热门声音，旋律完整，适合循环播放`;
  const playbackContextTitle = activeGenre === "全部" ? `发现流 · ${activeLabel}` : `发现流 · ${activeLabel} · ${activeGenre}`;

  function playTrack(index: number) {
    const queue = tracks.map(toPlayerTrack).filter((track): track is PlayerTrack => Boolean(track));
    if (queue.length === 0) return;
    const selected = toPlayerTrack(tracks[index]!);
    const startIndex = selected ? queue.findIndex((track) => track.id === selected.id) : 0;
    playQueue(queue, Math.max(startIndex, 0), { title: playbackContextTitle, href: "/discover" });
    setQueueOpen(true);
  }

  function toggleSave(track: DiscoverFlowTrack) {
    setSavedTrackIds((current) => {
      const saved = current.includes(track.id);
      const next = saved ? current.filter((id) => id !== track.id) : [...current, track.id];
      window.localStorage.setItem(SAVED_TRACKS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("library-saved-updated"));
      toast(saved ? "已取消收藏" : "已收藏到发现页", "success");
      return next;
    });
  }

  function getPlaylistQueue(playlist: DiscoverFlowPlaylist) {
    return playlist.tracks
      .map((item) => trackById.get(item.track.id))
      .filter((track): track is DiscoverFlowTrack => Boolean(track))
      .map(toPlayerTrack)
      .filter((track): track is PlayerTrack => Boolean(track));
  }

  function playPlaylist(playlist: DiscoverFlowPlaylist) {
    const queue = getPlaylistQueue(playlist);
    if (queue.length === 0) {
      toast("这个歌单暂时没有可播放曲目", "error");
      return;
    }
    playQueue(queue, 0, { title: `歌单 · ${playlist.title}`, href: `/playlists/${playlist.id}` });
    setQueueOpen(true);
  }

  function playChallengeMix() {
    const queue = tracks.slice(0, 8).map(toPlayerTrack).filter((track): track is PlayerTrack => Boolean(track));
    if (queue.length === 0) {
      toast("当前挑战还没有可播放作品", "error");
      return;
    }
    playQueue(queue, 0, { title: `挑战 · ${activeGenre === "全部" ? activeLabel : activeGenre}`, href: "/discover" });
    setQueueOpen(true);
  }

  function toggleSavePlaylist(playlist: DiscoverFlowPlaylist) {
    setSavedPlaylistIds((current) => {
      const saved = current.includes(playlist.id);
      const next = saved ? current.filter((id) => id !== playlist.id) : [...current, playlist.id];
      window.localStorage.setItem(SAVED_PLAYLISTS_KEY, JSON.stringify(next));
      toast(saved ? "已取消保存歌单" : "已保存歌单", "success");
      return next;
    });
  }

  function playlistCreateHref(playlist: DiscoverFlowPlaylist) {
    const titles = playlist.tracks.slice(0, 3).map((item) => `《${item.track.title}》`).join("、");
    return `/studio/simple?prompt=${encodeURIComponent(`参考歌单“${playlist.title}”的氛围，融合${titles || "编辑精选曲目"}，生成一首新的中文 AI 音乐`)}`;
  }

  function addLater(track: DiscoverFlowTrack) {
    const playerTrack = toPlayerTrack(track);
    if (!playerTrack) {
      toast("这首歌暂时没有可播放音频", "error");
      return;
    }
    enqueue([playerTrack]);
    toast("已加入稍后播放", "success");
  }

  async function shareTrack(track: DiscoverFlowTrack) {
    const url = `${window.location.origin}/tracks/${track.id}`;
    if (navigator.share) {
      await navigator.share({ title: `${track.title} - Melo`, url }).catch(() => null);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => null);
    toast("歌曲链接已复制", "success");
  }

  function similarCreateHref(track: DiscoverFlowTrack) {
    return `/studio/simple?prompt=${encodeURIComponent(`根据《${track.title}》的氛围，生成一首新的中文 AI 音乐`)}&genre=${encodeURIComponent(track.genre ?? "")}`;
  }

  function remixHref(track: DiscoverFlowTrack) {
    const params = new URLSearchParams({
      source: track.id,
      mode: "remix",
      prompt: `Remix《${track.title}》，保留核心氛围，生成一个新的中文 AI 音乐版本`,
    });
    if (track.genre) params.set("genre", track.genre);
    return `/studio/pro?${params.toString()}`;
  }

  async function copyTrackLink(track: DiscoverFlowTrack) {
    await navigator.clipboard?.writeText(`${window.location.origin}/tracks/${track.id}`).catch(() => null);
    toast("歌曲链接已复制", "success");
    setOpenMoreTrackId(null);
  }

  function reportTrack(track: DiscoverFlowTrack) {
    toast(`已记录《${track.title}》的反馈入口`, "info");
    setOpenMoreTrackId(null);
  }

  return (
    <section className="mb-6 rounded-lg border border-panel-border bg-black/20 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Discover Feed</div>
          <h2 className="mt-1 text-2xl font-semibold">发现流</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition",
                  active
                    ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                    : "border-panel-border text-muted-foreground hover:border-studio-gold/45 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {genreFilters.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => setActiveGenre(genre)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition",
              activeGenre === genre
                ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                : "border-panel-border bg-black/20 text-muted-foreground hover:border-studio-gold/45 hover:text-foreground",
            )}
          >
            {genre}
          </button>
        ))}
      </div>

      {activeTab === "challenge" ? (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 md:grid-cols-3">
            {challengeCards.map((challenge, index) => (
              <div
                key={challenge.title}
                className="overflow-hidden rounded-lg border border-panel-border bg-black/20 transition hover:border-studio-gold/45"
              >
                <div className="relative aspect-square bg-black/30">
                  <Image
                    src={artworkUrl(`challenge-${challenge.title}`)}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-xs text-white/85 backdrop-blur">
                    {challenge.status}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-xl font-semibold">{challenge.title}</div>
                    <div className="mt-1 text-xs text-white/70">{challenge.prize}</div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="min-h-16 text-sm leading-6 text-muted-foreground">{challenge.brief}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/studio/simple?prompt=${encodeURIComponent(challenge.prompt)}`}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-studio-gold/35 bg-studio-gold/10 px-2 text-sm text-studio-gold transition hover:border-studio-gold/60"
                    >
                      <Sparkles className="size-3.5" />
                      参加
                    </Link>
                    <Link
                      href={tracks[index] ? remixHref(tracks[index]!) : "/studio/pro?mode=remix"}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-panel-border bg-black/20 px-2 text-sm text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                    >
                      <Repeat2 className="size-3.5" />
                      Remix
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.16),rgba(0,0,0,0.24))] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Challenge Board</div>
                <div className="mt-2 text-lg font-semibold">挑战榜</div>
              </div>
              <Trophy className="size-5 text-studio-gold" />
            </div>
            <div className="mt-4 grid gap-2">
              {tracks.slice(0, 4).map((track, index) => (
                <Link
                  key={`challenge-${track.id}`}
                  href={`/tracks/${track.id}`}
                  className="flex items-center gap-3 rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-studio-gold/10 font-mono text-xs text-studio-gold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{track.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{track.creator.displayName}</span>
                  </span>
                  <Award className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
            <Button type="button" className="mt-4 w-full" onClick={playChallengeMix}>
              <Play className="size-4" />
              播放挑战作品
            </Button>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-lg border border-panel-border bg-black/20 p-3">
                <div className="flex items-center gap-1">
                  <CalendarDays className="size-3.5 text-studio-gold" />
                  截止
                </div>
                <div className="mt-1 text-foreground">周日 24:00</div>
              </div>
              <div className="rounded-lg border border-panel-border bg-black/20 p-3">
                <div>当前筛选</div>
                <div className="mt-1 text-foreground">{activeGenre}</div>
              </div>
            </div>
          </aside>
        </div>
      ) : activeTab === "playlists" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visiblePlaylists.slice(0, 4).map((playlist) => {
            const saved = savedPlaylistIds.includes(playlist.id);
            const playableCount = getPlaylistQueue(playlist).length;
            return (
            <div
              key={playlist.id}
              className="group overflow-hidden rounded-lg border border-panel-border bg-black/20 transition hover:border-studio-gold/45"
            >
              <div className="relative aspect-square bg-black/30">
                <Image
                  src={artworkUrl(playlist.id)}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
                <Library className="absolute right-3 top-3 size-5 text-white/80" />
                <button
                  type="button"
                  onClick={() => playPlaylist(playlist)}
                  className="absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-studio-gold shadow-lg backdrop-blur transition hover:border-studio-gold/45 hover:bg-black/75"
                  aria-label={`播放歌单 ${playlist.title}`}
                >
                  <Play className="size-5" />
                </button>
                <div className="absolute bottom-4 right-3 text-xs text-white/70">{playableCount || playlist.tracks.length} 首</div>
              </div>
              <div className="p-4">
                <div className="truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {playlist.owner?.displayName ?? "Melo 编辑部"}
                </div>
                <Link href={`/playlists/${playlist.id}`} className="mt-2 block truncate text-lg font-semibold transition hover:text-studio-gold">
                  {playlist.title}
                </Link>
                <div className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {playlist.tracks.slice(0, 3).map((item) => item.track.title).join(" / ")}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => playPlaylist(playlist)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-panel-border bg-black/20 px-2 text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                  >
                    <Play className="size-3.5" />
                    播放
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSavePlaylist(playlist)}
                    className={cn(
                      "inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-panel-border bg-black/20 px-2 text-xs transition hover:border-studio-gold/45",
                      saved ? "text-studio-gold" : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={saved ? `取消保存歌单 ${playlist.title}` : `保存歌单 ${playlist.title}`}
                  >
                    {saved ? <Check className="size-3.5" /> : <Heart className="size-3.5" />}
                    保存
                  </button>
                  <Link
                    href={playlistCreateHref(playlist)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-panel-border bg-black/20 px-2 text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                  >
                    <Sparkles className="size-3.5" />
                    创作
                  </Link>
                </div>
              </div>
            </div>
          );
          })}
          {visiblePlaylists.length === 0 ? (
            <div className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm text-muted-foreground">
              当前风格下还没有匹配歌单，可以切换风格或直接进入分类页继续探索。
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {tracks.slice(0, 8).map((track, index) => (
              <div
                key={`${activeTab}-${track.id}`}
                className="group overflow-hidden rounded-lg border border-panel-border bg-black/20 transition hover:border-studio-gold/45 hover:bg-white/[0.03]"
              >
                <div className="relative aspect-square overflow-hidden bg-black/30">
                  <Image
                    src={track.coverUrl ?? artworkUrl(track.id)}
                    alt=""
                    fill
                    sizes="(min-width: 1536px) 18vw, (min-width: 768px) 32vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-transparent" />
                  <button
                    type="button"
                    onClick={() => playTrack(index)}
                    className="absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-studio-gold shadow-lg backdrop-blur transition hover:border-studio-gold/45 hover:bg-black/75"
                    aria-label={`播放 ${track.title}`}
                  >
                    <Play className="size-5" />
                  </button>
                  <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-xs text-white/85 backdrop-blur">
                    {track.genre ?? "单曲"}
                  </div>
                  <div className="absolute bottom-4 right-3 text-right text-xs text-white/70">
                    {Math.round(track.playCount / 1000)}k
                  </div>
                </div>
                <div className="p-3">
                  <Link href={`/tracks/${track.id}`} className="block min-w-0">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
                  </Link>
                </div>
                <div className="relative flex flex-wrap gap-1 px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => toggleSave(track)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border border-panel-border bg-black/20 transition hover:border-studio-gold/45",
                      savedTrackIds.includes(track.id) ? "text-studio-gold" : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={savedTrackIds.includes(track.id) ? `取消收藏 ${track.title}` : `收藏 ${track.title}`}
                    title={savedTrackIds.includes(track.id) ? "取消收藏" : "收藏"}
                  >
                    <Heart className={cn("size-3.5", savedTrackIds.includes(track.id) ? "fill-current" : "")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => addLater(track)}
                    className="flex size-8 items-center justify-center rounded-lg border border-panel-border bg-black/20 text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                    aria-label={`加入稍后播放 ${track.title}`}
                    title="稍后播放"
                  >
                    <ListMusic className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareTrack(track)}
                    className="flex size-8 items-center justify-center rounded-lg border border-panel-border bg-black/20 text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                    aria-label={`分享 ${track.title}`}
                    title="分享"
                  >
                    <Share2 className="size-3.5" />
                  </button>
                  <Link
                    href={remixHref(track)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-panel-border bg-black/20 px-2 text-xs font-medium text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                    aria-label={`Remix ${track.title}`}
                    title="Remix"
                  >
                    <Repeat2 className="size-3.5" />
                    <span>Remix</span>
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMoreTrackId((current) => (current === track.id ? null : track.id))}
                      className="flex size-8 items-center justify-center rounded-lg border border-panel-border bg-black/20 text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                      aria-label={`更多选项 ${track.title}`}
                      aria-expanded={openMoreTrackId === track.id}
                      title="更多选项"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                    {openMoreTrackId === track.id ? (
                      <div className="absolute right-0 top-9 z-30 w-52 rounded-lg border border-panel-border bg-[#111317] p-1 text-sm shadow-2xl">
                        <Link
                          href={similarCreateHref(track)}
                          className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                          <Sparkles className="size-4 text-studio-gold" />
                          相似创作
                        </Link>
                        <Link
                          href={`/tracks/${track.id}`}
                          className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                          <ExternalLink className="size-4 text-studio-gold" />
                          查看详情
                        </Link>
                        <button
                          type="button"
                          onClick={() => addLater(track)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                          <ListMusic className="size-4 text-studio-gold" />
                          加入播放队列
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyTrackLink(track)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                          <Copy className="size-4 text-studio-gold" />
                          复制链接
                        </button>
                        <div className="my-1 h-px bg-panel-border" />
                        <button
                          type="button"
                          onClick={() => reportTrack(track)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                          <Flag className="size-4 text-destructive" />
                          举报 / 反馈
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {tracks.length === 0 ? (
              <div className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm text-muted-foreground md:col-span-2">
                当前组合下没有匹配歌曲，换一个风格或切到新歌/热播继续探索。
              </div>
            ) : null}
          </div>

          <aside className="rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.14),rgba(0,0,0,0.24))] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Create From Feed</div>
            <div className="mt-2 text-lg font-semibold">{activeLabel}灵感</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              把当前发现流的氛围直接带进创作台，继续生成一首属于你的中文 AI 音乐。
            </p>
            <div className="mt-4 rounded-lg border border-panel-border bg-black/20 p-3">
              <div className="text-xs text-muted-foreground">本地收藏</div>
              <div className="mt-1 text-2xl font-semibold">{savedTrackIds.length}</div>
            </div>
            <div className="mt-3 rounded-lg border border-panel-border bg-black/20 p-3">
              <div className="text-xs text-muted-foreground">当前筛选</div>
              <div className="mt-1 text-sm font-medium">{activeGenre}</div>
              <div className="mt-1 text-xs text-muted-foreground">{tracks.length} 个结果</div>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link
                href={`/studio/simple?prompt=${encodeURIComponent(activePrompt)}${
                  activeGenre === "全部" ? "" : `&genre=${encodeURIComponent(activeGenre)}`
                }`}
              >
                用这个氛围创作
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </aside>
        </div>
      )}
    </section>
  );
}
