import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Library,
  Mic2,
  PlayCircle,
  Search,
  Sparkles,
  Trophy,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartList } from "@/components/ChartList";
import { MusicSidebar } from "@/components/MusicSidebar";
import { RecentListening } from "@/components/RecentListening";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import {
  getSeedCreatorChart,
  getSeedHotChart,
  getSeedNewChart,
  getSeedPlaylist,
  getSeedPublicPlaylists,
} from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface HomeTrack {
  id: string;
  title: string;
  genre?: string | null;
  playCount: number;
  likeCount: number;
  creator: { id: string; displayName: string; avatarKey?: string | null };
}

interface PlaylistResponse {
  id: string;
  title: string;
  owner: { displayName: string };
  tracks: Array<{ track: HomeTrack }>;
}

interface CreatorChartItem {
  rank: number;
  creatorId: string;
  creator: { id: string; displayName: string };
  trackCount: number;
  playCount: number;
}

interface PublicPlaylistListResponse {
  items: PlaylistResponse[];
}

async function getTracks(path: string): Promise<HomeTrack[]> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
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
      creator: {
        id: track.creator.id,
        displayName: track.creator.displayName,
        avatarKey: null,
      },
    }));
  }
}

async function getPlaylist(id: string): Promise<PlaylistResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/playlists/public/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    return response.json();
  } catch {
    const playlist = getSeedPlaylist(id);
    return playlist
      ? {
          id: playlist.id,
          title: playlist.title,
          owner: playlist.owner,
          tracks: playlist.tracks.map((item) => ({
            track: {
              id: item.track.id,
              title: item.track.title,
              genre: item.track.genre,
              playCount: item.track.playCount,
              likeCount: item.track.likeCount,
              creator: {
                id: item.track.creator.id,
                displayName: item.track.creator.displayName,
                avatarKey: null,
              },
            },
          })),
        }
      : null;
  }
}

async function getPublicPlaylists(): Promise<PlaylistResponse[]> {
  try {
    const response = await fetch(`${API_BASE}/playlists/public`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = (await response.json()) as PublicPlaylistListResponse;
    return data.items ?? [];
  } catch {
    return getSeedPublicPlaylists().map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      owner: { displayName: playlist.owner.displayName },
      tracks: playlist.tracks.map((item) => ({
        track: {
          id: item.track.id,
          title: item.track.title,
          genre: item.track.genre,
          playCount: item.track.playCount,
          likeCount: item.track.likeCount,
          creator: {
            id: item.track.creator.id,
            displayName: item.track.creator.displayName,
            avatarKey: null,
          },
        },
      })),
    }));
  }
}

async function getCreatorChart(): Promise<CreatorChartItem[]> {
  try {
    const response = await fetch(`${API_BASE}/charts/creators`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return getSeedCreatorChart().map((item) => ({
      rank: item.rank,
      creatorId: item.creatorId,
      creator: { id: item.creator.id, displayName: item.creator.displayName },
      trackCount: item.trackCount,
      playCount: item.playCount,
    }));
  }
}

const genres = [
  { title: "中文流行", href: "/categories?genre=%E4%B8%AD%E6%96%87%E6%B5%81%E8%A1%8C" },
  { title: "国风", href: "/categories?genre=%E5%9B%BD%E9%A3%8E" },
  { title: "R&B", href: "/categories?genre=R%26B" },
  { title: "电子", href: "/categories?genre=%E7%94%B5%E5%AD%90" },
  { title: "Lo-fi", href: "/categories?genre=Lo-fi" },
  { title: "影视配乐", href: "/categories?genre=%E5%BD%B1%E8%A7%86%E9%85%8D%E4%B9%90" },
];

const navItems = [
  { href: "/discover", label: "发现音乐", icon: Compass },
  { href: "/search", label: "搜索歌曲", icon: Search },
  { href: "/charts", label: "榜单", icon: Trophy },
  { href: "/library", label: "曲库", icon: Library },
  { href: "/studio", label: "创作中心", icon: Mic2 },
];

function uniqueCreators(tracks: HomeTrack[]) {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (seen.has(track.creator.id)) return false;
    seen.add(track.creator.id);
    return true;
  });
}

export default async function HomePage() {
  const [hotTracks, newTracks, playlist, publicPlaylists, creatorChart] = await Promise.all([
    getTracks("/charts/hot"),
    getTracks("/charts/new"),
    getPlaylist("editor-picks"),
    getPublicPlaylists(),
    getCreatorChart(),
  ]);

  const featuredTracks = playlist?.tracks.map((item) => item.track) ?? hotTracks.slice(0, 6);
  const creators = uniqueCreators([...hotTracks, ...newTracks]).slice(0, 6);
  const playlistCards = publicPlaylists.slice(0, 6);
  const quickLinks = [
    ...featuredTracks.slice(0, 3).map((track) => ({
      href: `/tracks/${track.id}`,
      title: track.title,
      subtitle: track.creator.displayName,
    })),
    ...playlistCards.slice(0, 3).map((item) => ({
      href: `/playlists/${item.id}`,
      title: item.title,
      subtitle: item.owner.displayName,
    })),
  ].slice(0, 6);
  const sidebarItems = featuredTracks.slice(0, 5).map((track) => ({
    href: `/tracks/${track.id}`,
    title: track.title,
    subtitle: track.creator.displayName,
  }));

  return (
    <main className="studio-backdrop min-h-screen bg-background pb-24 text-foreground">
      <SiteNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <MusicSidebar navItems={navItems} libraryItems={sidebarItems} genres={genres} />

        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(180deg,rgba(233,200,111,0.24),rgba(17,19,23,0.96)_48%)] p-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">编辑精选</div>
                <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">今日推荐</h1>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  热播单曲、新歌速递、精选歌单，一站收听。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="lg">
                    <Link href="/playlists/editor-picks">
                      <PlayCircle className="size-4" />
                      立即播放
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/library">浏览曲库</Link>
                  </Button>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg bg-black/30 p-3 transition hover:bg-black/40"
                    >
                      <div className="flex size-12 items-center justify-center rounded bg-studio-gold/12 text-studio-gold">
                        <PlayCircle className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { label: "公开歌单", value: playlistCards.length.toString().padStart(2, "0"), icon: Library },
                  { label: "热门单曲", value: hotTracks.length.toString().padStart(2, "0"), icon: Trophy },
                  { label: "入驻创作者", value: creators.length.toString().padStart(2, "0"), icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border border-panel-border bg-black/20 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</div>
                        <Icon className="size-4 text-studio-gold" />
                      </div>
                      <div className="mt-3 text-2xl font-semibold">{item.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <RecentListening />

          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <ShelfHeader title="优先浏览的歌单" href="/library" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {playlistCards.map((item) => (
                  <Link
                    key={item.id}
                    href={`/playlists/${item.id}`}
                    className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.owner.displayName}</div>
                    <div className="mt-3 line-clamp-2 text-lg font-semibold">{item.title}</div>
                    <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.tracks.slice(0, 2).map((track) => track.track.title).join(" / ")}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">{item.tracks.length} 首曲目</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="studio-surface rounded-lg p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">持续热播</div>
                  <div className="mt-1 text-lg font-semibold">站内热门单曲</div>
                </div>
                <Link href="/charts" className="text-sm text-studio-gold">
                  查看更多 <ArrowRight className="inline size-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {hotTracks.slice(0, 8).map((track, index) => (
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
                    <div className="text-xs text-muted-foreground">{track.playCount.toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <HomeShelf title="编辑精选单曲" href="/playlists/editor-picks" items={featuredTracks.slice(0, 6)} />
              <HomeShelf title="新歌上架" href="/discover" items={newTracks.slice(0, 6)} />
            </div>

            <div className="space-y-5">
              <div className="studio-surface rounded-lg p-5">
                <ChartList type="hot" />
              </div>
              <div className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Waves className="size-5 text-meter-green" />
                  创作者上升榜
                </div>
                <div className="space-y-2">
                  {creatorChart.slice(0, 6).map((item) => (
                    <Link
                      key={item.creatorId}
                      href={`/creators/${item.creatorId}`}
                      className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {item.rank}. {item.creator.displayName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {item.trackCount} 首作品 / {item.playCount.toLocaleString()} 播放
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <ShelfHeader title="热门创作者" href="/charts" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {creators.map((track) => (
                <Link
                  key={track.creator.id}
                  href={`/creators/${track.creator.id}`}
                  className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{track.genre || "创作者"}</div>
                  <div className="mt-3 text-lg font-semibold">{track.creator.displayName}</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{track.title}</div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    播放 {track.playCount.toLocaleString()} / 收藏 {track.likeCount.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function ShelfHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link href={href} className="text-sm text-studio-gold">
        查看更多 <ArrowRight className="inline size-3" />
      </Link>
    </div>
  );
}

function HomeShelf({ title, href, items }: { title: string; href: string; items: HomeTrack[] }) {
  return (
    <section>
      <ShelfHeader title={title} href={href} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((track) => (
          <Link
            key={track.id}
            href={`/tracks/${track.id}`}
            className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{track.genre || "单曲"}</div>
            <div className="mt-3 text-lg font-semibold">{track.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{track.creator.displayName}</div>
            <div className="mt-4 text-xs text-muted-foreground">
              播放 {track.playCount.toLocaleString()} / 收藏 {track.likeCount.toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
