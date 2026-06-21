import Link from "next/link";
import { Compass, Library, Mic2, Search, Trophy } from "lucide-react";
import { LibrarySearch } from "@/components/LibrarySearch";
import { MusicSidebar } from "@/components/MusicSidebar";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";
import { getSeedHotChart, getSeedPlaylist, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface LibraryTrack {
  id: string;
  title: string;
  creator: { displayName: string };
}

interface PlaylistResponse {
  id: string;
  title: string;
  owner?: { displayName: string };
  tracks: Array<{ track: LibraryTrack }>;
}

interface HotTrack {
  id: string;
  title: string;
  playCount: number;
  creator: { displayName: string };
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
          tracks: playlist.tracks.map((item) => ({
            track: {
              id: item.track.id,
              title: item.track.title,
              creator: { displayName: item.track.creator.displayName },
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
    const data = (await response.json()) as { items?: PlaylistResponse[] };
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
          creator: { displayName: item.track.creator.displayName },
        },
      })),
    }));
  }
}

async function getHotTracks(): Promise<HotTrack[]> {
  try {
    const response = await fetch(`${API_BASE}/charts/hot`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return getSeedHotChart().map((track) => ({
      id: track.id,
      title: track.title,
      playCount: track.playCount,
      creator: { displayName: track.creator.displayName },
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

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const [playlist, publicPlaylists, hotTracks] = await Promise.all([
    getPlaylist("editor-picks"),
    getPublicPlaylists(),
    getHotTracks(),
  ]);

  const sidebarItems = (playlist?.tracks ?? []).slice(0, 5).map((item) => ({
    href: `/tracks/${item.track.id}`,
    title: item.track.title,
    subtitle: item.track.creator.displayName,
  }));

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="曲库" title="曲库" actions={<LibrarySearch initialQuery={query} />}>
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <MusicSidebar navItems={navItems} libraryItems={sidebarItems} genres={genres} />

          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="studio-surface rounded-lg p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">收藏集合</div>
                <div className="mt-3 text-lg font-semibold">喜欢的音乐</div>
              </div>
              <div className="studio-surface rounded-lg p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">歌单</div>
                <div className="mt-3 text-lg font-semibold">编辑精选</div>
              </div>
              <div className="studio-surface rounded-lg p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">创作</div>
                <div className="mt-3 text-lg font-semibold">发布作品</div>
              </div>
              <div className="studio-surface rounded-lg p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">热播</div>
                <div className="mt-3 text-lg font-semibold">{hotTracks.length.toString().padStart(2, "0")} 首单曲</div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">正在流行的歌单</h2>
                  <Link href="/discover" className="text-sm text-studio-gold">
                    去发现
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {publicPlaylists.slice(0, 6).map((item) => (
                    <Link
                      key={item.id}
                      href={`/playlists/${item.id}`}
                      className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                    >
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {item.owner?.displayName ?? "编辑歌单"}
                      </div>
                      <div className="mt-3 text-lg font-semibold">{item.title}</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {item.tracks.slice(0, 2).map((track) => track.track.title).join(" · ")}
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">{item.tracks.length} 首曲目</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="studio-surface rounded-lg p-5">
                <div className="mb-4 text-lg font-semibold">持续热播</div>
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

            <TrackList searchQuery={query || undefined} />
          </div>
        </div>
      </StudioShell>
    </>
  );
}
