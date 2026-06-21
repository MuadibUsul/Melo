import Link from "next/link";
import { Search, Sparkles, Waves } from "lucide-react";
import { LibrarySearch } from "@/components/LibrarySearch";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";
import { getSeedHotChart, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const quickGenres = ["中文流行", "国风", "R&B", "电子", "Lo-fi", "影视配乐"];
const hotKeywords = ["城市微光", "月下归舟", "蓝色凌晨", "Lo-fi", "影视配乐", "专注工作流"];

interface PlaylistResponse {
  id: string;
  title: string;
  owner?: { displayName: string };
  tracks: Array<{ track: { id: string; title: string } }>;
}

interface HotTrack {
  id: string;
  title: string;
  creator: { displayName: string };
  playCount: number;
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
      tracks: playlist.tracks.map((item) => ({ track: { id: item.track.id, title: item.track.title } })),
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
      creator: { displayName: track.creator.displayName },
      playCount: track.playCount,
    }));
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const [playlists, hotTracks] = await Promise.all([getPublicPlaylists(), getHotTracks()]);

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="搜索" title="搜索" actions={<LibrarySearch initialQuery={query} actionPath="/search" />}>
        {query ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(180deg,rgba(233,200,111,0.16),rgba(17,19,23,0.96)_44%)] p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">搜索结果</div>
              <h2 className="mt-3 text-3xl font-semibold">{query}</h2>
            </section>
            <TrackList searchQuery={query} />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="studio-surface rounded-lg p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Search className="size-5 text-studio-gold" />
                搜索歌曲、创作者或风格
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {hotKeywords.map((keyword) => (
                  <Link
                    key={keyword}
                    href={`/search?q=${encodeURIComponent(keyword)}`}
                    className="rounded-full border border-panel-border px-3 py-2 text-sm text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                  >
                    {keyword}
                  </Link>
                ))}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <section>
                <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="size-5 text-studio-gold" />
                  快速分类
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {quickGenres.map((genre) => (
                    <Link
                      key={genre}
                      href={`/categories?genre=${encodeURIComponent(genre)}`}
                      className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                    >
                      <div className="text-sm font-medium">{genre}</div>
                      <div className="mt-1 text-xs text-muted-foreground">进入该风格</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Waves className="size-5 text-meter-green" />
                  正在热播
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
              </section>
            </div>

            <section>
              <div className="mb-3 text-lg font-semibold">可以先从这些歌单开始</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {playlists.slice(0, 4).map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {playlist.owner?.displayName ?? "编辑推荐"}
                    </div>
                    <div className="mt-3 text-lg font-semibold">{playlist.title}</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {playlist.tracks.slice(0, 2).map((item) => item.track.title).join(" · ")}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </StudioShell>
    </>
  );
}
