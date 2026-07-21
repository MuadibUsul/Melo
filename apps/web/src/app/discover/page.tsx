import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  Headphones,
  Library,
  PlayCircle,
  Radio,
  Sparkles,
  Trophy,
  Waves,
} from "lucide-react";
import { ChartList } from "@/components/ChartList";
import { DiscoverFlow } from "@/components/DiscoverFlow";
import { DiscoverShelves } from "@/components/DiscoverShelves";
import { LocalPublishedTracksShelf } from "@/components/LocalPublishedTracksShelf";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { QuickCreateComposer } from "@/components/QuickCreateComposer";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/api/server-fetch";
import { formatMeloName } from "@/lib/brand";
import { getSeedHotChart, getSeedNewChart, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const genreCards = [
  { title: "中文流行", tone: "城市夜色", href: "/categories?genre=%E4%B8%AD%E6%96%87%E6%B5%81%E8%A1%8C" },
  { title: "国风", tone: "弦乐与诗意", href: "/categories?genre=%E5%9B%BD%E9%A3%8E" },
  { title: "R&B", tone: "松弛律动", href: "/categories?genre=R%26B" },
  { title: "电子", tone: "舞池能量", href: "/categories?genre=%E7%94%B5%E5%AD%90" },
  { title: "Lo-fi", tone: "专注陪伴", href: "/categories?genre=Lo-fi" },
  { title: "影视配乐", tone: "画面推进", href: "/categories?genre=%E5%BD%B1%E8%A7%86%E9%85%8D%E4%B9%90" },
  { title: "游戏配乐", tone: "战斗循环", href: "/categories?genre=%E6%B8%B8%E6%88%8F%E9%85%8D%E4%B9%90" },
  { title: "民谣", tone: "木吉他叙事", href: "/categories?genre=%E6%B0%91%E8%B0%A3" },
];

interface PlaylistResponse {
  id: string;
  title: string;
  owner?: { displayName: string };
  tracks: Array<{ track: { id: string; title: string } }>;
}

interface HomeTrack {
  id: string;
  title: string;
  genre?: string | null;
  playCount: number;
  likeCount: number;
  audioUrl?: string;
  coverUrl?: string;
  durationMs?: number | null;
  creator: { id: string; displayName: string };
}

function artworkUrl(id: string) {
  return `/api/melo-artwork/${encodeURIComponent(id)}`;
}

async function getPublicPlaylists(): Promise<PlaylistResponse[]> {
  try {
    const response = await serverFetch(`${API_BASE}/playlists/public`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = (await response.json()) as { items?: PlaylistResponse[] };
    return (data.items ?? []).map((playlist) => ({
      ...playlist,
      owner: { displayName: formatMeloName(playlist.owner?.displayName) },
    }));
  } catch {
    return getSeedPublicPlaylists().map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      owner: { displayName: formatMeloName(playlist.owner.displayName) },
      tracks: playlist.tracks.map((item) => ({ track: { id: item.track.id, title: item.track.title } })),
    }));
  }
}

async function getTracks(path: string): Promise<HomeTrack[]> {
  try {
    const response = await serverFetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return (path === "/charts/hot" ? getSeedHotChart() : getSeedNewChart()).map((track) => ({
      id: track.id,
      title: track.title,
      genre: track.genre,
      playCount: track.playCount,
      likeCount: track.likeCount,
      audioUrl: track.audioUrl,
      coverUrl: artworkUrl(track.id),
      durationMs: track.durationMs,
      creator: { id: track.creator.id, displayName: track.creator.displayName },
    }));
  }
}

export default async function DiscoverPage() {
  const [playlists, hotTracks, newTracks] = await Promise.all([
    getPublicPlaylists(),
    getTracks("/charts/hot"),
    getTracks("/charts/new"),
  ]);

  const leadTrack = hotTracks[0];

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" showHeader={false} title="发现">
        <section className="mb-10 flex min-h-[340px] flex-col items-center justify-center text-center">
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            让音乐释放出来
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            把旋律、歌词、声音或一段情绪写下来，Melo 会把灵感带进创作台，生成属于你的音乐。
          </p>
          <QuickCreateComposer className="w-full max-w-3xl text-left" />
        </section>

        <DiscoverFlow hotTracks={hotTracks} newTracks={newTracks} playlists={playlists} />

        <LocalPublishedTracksShelf title="我的最新发布" limit={6} />

        <ModelSpotlight leadTrack={leadTrack} />

        <DiscoverShelves hotTracks={hotTracks} newTracks={newTracks} playlists={playlists} />

        <section className="mb-6 overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.22),rgba(9,10,12,0.98)_48%,rgba(39,224,167,0.10))] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
            <div className="flex min-h-[360px] flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-black/25 px-3 py-1 text-xs text-studio-gold">
                  <Sparkles className="size-3.5" />
                  今日编辑推荐
                </div>
                <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                  播放正在流行的中文 AI 音乐
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                  热门单曲、新歌、精选歌单和风格频道集中在同一个发现页，方便你像逛音乐社区一样找到下一首循环。
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button asChild size="lg">
                    <Link href={leadTrack ? `/tracks/${leadTrack.id}` : "/charts"}>
                      <PlayCircle className="size-4" />
                      播放热门
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/create">
                      开始创作
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "热门单曲", value: hotTracks.length.toString().padStart(2, "0"), icon: Flame },
                  { label: "精选歌单", value: playlists.length.toString().padStart(2, "0"), icon: Library },
                  { label: "风格频道", value: genreCards.length.toString().padStart(2, "0"), icon: Radio },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border border-panel-border bg-black/25 p-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {item.label}
                        <Icon className="size-4 text-studio-gold" />
                      </div>
                      <div className="mt-3 text-2xl font-semibold">{item.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-panel-border bg-black/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Trending</div>
                  <div className="mt-1 text-lg font-semibold">趋势播放列表</div>
                </div>
                <Trophy className="size-5 text-studio-gold" />
              </div>
              <div className="space-y-2">
                {hotTracks.slice(0, 6).map((track, index) => (
                  <Link
                    key={track.id}
                    href={`/tracks/${track.id}`}
                    className="flex items-center gap-3 rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45"
                  >
                    <span className="w-7 text-center font-mono text-sm text-muted-foreground">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{track.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{Math.round(track.playCount / 1000)}k</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div>
            <ShelfHeader title="为你推荐的歌单" href="/library" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.slice(0, 6).map((playlist, index) => (
                <Link
                  key={playlist.id}
                  href={`/playlists/${playlist.id}`}
                  className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {playlist.owner?.displayName ?? "Melo 编辑部"}
                    </div>
                    <span className="rounded bg-studio-gold/10 px-2 py-1 text-xs text-studio-gold">0{index + 1}</span>
                  </div>
                  <div className="mt-4 text-lg font-semibold">{playlist.title}</div>
                  <div className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                    {playlist.tracks.slice(0, 3).map((item) => item.track.title).join(" / ")}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Headphones className="size-3.5" />
                    {playlist.tracks.length} 首曲目
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Challenge</div>
                <div className="mt-1 text-lg font-semibold">Melo 创作挑战</div>
              </div>
              <CalendarDays className="size-5 text-meter-green" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              本周主题是“夏夜来信”。用一段歌词、一种风格或一条旋律提示生成你的作品，优秀投稿会进入发现页推荐。
            </p>
            <div className="mt-5 grid gap-2">
              {[
                { label: "提交作品", href: "/studio/drafts" },
                { label: "浏览参赛曲", href: "/charts" },
                { label: "查看主题灵感", href: "/create" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 px-3 py-3 text-sm transition hover:border-studio-gold/45"
                >
                  {item.label}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Radio className="size-5 text-studio-gold" />
              按风格浏览
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {genreCards.map((genre) => (
                <Link
                  key={genre.title}
                  href={genre.href}
                  className="rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45"
                >
                  <div className="font-medium">{genre.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{genre.tone}</div>
                </Link>
              ))}
            </div>
          </section>
          <section className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-studio-gold" />
              热门趋势
            </div>
            <ChartList type="hot" />
          </section>
        </section>

        <section className="mb-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Waves className="size-5 text-meter-green" />
              新歌上架
            </div>
            <div className="space-y-2">
              {newTracks.slice(0, 8).map((track, index) => (
                <Link
                  key={track.id}
                  href={`/tracks/${track.id}`}
                  className="flex items-center gap-3 rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                >
                  <span className="w-6 text-center font-mono text-sm text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{track.genre || "单曲"}</div>
                </Link>
              ))}
            </div>
          </div>

          <section>
            <ShelfHeader title="正在被喜欢" href="/charts" />
            <div className="grid gap-3 sm:grid-cols-2">
              {hotTracks.slice(0, 4).map((track) => (
                <Link
                  key={track.id}
                  href={`/tracks/${track.id}`}
                  className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{track.genre || "单曲"}</div>
                  <div className="mt-3 text-lg font-semibold">{track.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{track.creator.displayName}</div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    播放 {track.playCount.toLocaleString("zh-CN")} / 收藏 {track.likeCount.toLocaleString("zh-CN")}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Headphones className="size-5 text-meter-green" />
            最新作品
          </div>
          <TrackList />
        </section>
      </StudioShell>
    </>
  );
}

function ShelfHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm text-studio-gold">
        查看更多
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function ModelSpotlight({ leadTrack }: { leadTrack?: HomeTrack }) {
  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-studio-gold/30 bg-[linear-gradient(135deg,rgba(233,200,111,0.24),rgba(9,10,12,0.96)_50%,rgba(39,224,167,0.14))] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-studio-gold/35 bg-black/25 px-3 py-1 text-xs font-medium text-studio-gold">
            <Sparkles className="size-3.5" />
            新模型
          </div>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Melo v5.5，更像你的声音</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            为中文歌词、人声质感和个人风格做了新的调校。用一句描述开始，或者从正在流行的作品里 Remix 出你的版本。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/create">
                立即试用
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={leadTrack ? `/studio/pro?source=${leadTrack.id}&mode=remix` : "/studio/pro"}>
                Remix 热门作品
              </Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-panel-border bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">v5.5 Preview</div>
          <div className="mt-4 grid gap-2">
            {["更自然的中文咬字", "更稳定的副歌记忆点", "更适合 Remix 的结构"].map((item) => (
              <div key={item} className="rounded-lg border border-panel-border bg-black/20 px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
