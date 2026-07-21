import Link from "next/link";
import { Compass, ListMusic, Search, Sparkles, UserRound, WandSparkles, Waves } from "lucide-react";
import { LibrarySearch } from "@/components/LibrarySearch";
import { LocalPublishedTracksShelf } from "@/components/LocalPublishedTracksShelf";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/api/server-fetch";
import { formatMeloName } from "@/lib/brand";
import { getSeedHotChart, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const quickGenres = ["中文流行", "国风", "R&B", "电子", "Lo-fi", "影视配乐"];
const hotKeywords = ["城市微光", "月下归舟", "蓝色凌晨", "Lo-fi", "影视配乐", "专注工作流"];
const promptIdeas = [
  "夏夜来信，温暖女声，中文流行",
  "国风电子，适合角色登场",
  "雨声与钢琴，深夜 Lo-fi",
];

interface PlaylistResponse {
  id: string;
  title: string;
  owner?: { displayName: string };
  tracks: Array<{ track: { id: string; title: string } }>;
}

interface HotTrack {
  id: string;
  title: string;
  creator: { id?: string; displayName: string };
  playCount: number;
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

async function getHotTracks(): Promise<HotTrack[]> {
  try {
    const response = await serverFetch(`${API_BASE}/charts/hot`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return getSeedHotChart().map((track) => ({
      id: track.id,
      title: track.title,
      creator: { id: track.creator.id, displayName: track.creator.displayName },
      playCount: track.playCount,
    }));
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const [playlists, hotTracks] = await Promise.all([getPublicPlaylists(), getHotTracks()]);
  const normalizedQuery = query.toLowerCase();
  const matchingPlaylists = query
    ? playlists
        .filter((playlist) => {
          const haystack = [playlist.title, playlist.owner?.displayName, ...playlist.tracks.map((item) => item.track.title)]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        })
        .slice(0, 4)
    : playlists.slice(0, 4);
  const matchingCreators = query
    ? Array.from(
        new Map(
          hotTracks
            .filter((track) => track.creator.displayName.toLowerCase().includes(normalizedQuery))
            .map((track) => [track.creator.displayName, track.creator]),
        ).values(),
      ).slice(0, 4)
    : [];

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="搜索"
        title="搜索 Melo"
        description="查找歌曲、创作者、歌单和风格，也可以把关键词直接变成新的创作提示。"
        actions={<LibrarySearch initialQuery={query} actionPath="/search" />}
      >
        {query ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.18),rgba(17,19,23,0.96)_48%,rgba(39,224,167,0.10))] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">Search Results</div>
                  <h2 className="mt-3 text-3xl font-semibold">{query}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    先展示匹配歌曲，同时给出相关歌单、创作者和创作入口。
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/studio/simple?prompt=${encodeURIComponent(query)}`}>
                    <WandSparkles className="size-4" />
                    用这个关键词创作
                  </Link>
                </Button>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <div className="mb-3 text-lg font-semibold">歌曲</div>
                <TrackList searchQuery={query} />
              </div>

              <aside className="space-y-5">
                <LocalPublishedTracksShelf query={query} title="我的匹配作品" />

                <SearchShelf title="相关歌单" icon={ListMusic}>
                  {matchingPlaylists.length > 0 ? (
                    matchingPlaylists.map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${playlist.id}`}
                        className="block rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45"
                      >
                        <div className="text-sm font-medium">{playlist.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{playlist.owner?.displayName ?? "Melo 编辑部"}</div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg border border-panel-border bg-black/20 p-3 text-sm text-muted-foreground">
                      暂无匹配歌单
                    </div>
                  )}
                </SearchShelf>

                <SearchShelf title="相关创作者" icon={UserRound}>
                  {matchingCreators.length > 0 ? (
                    matchingCreators.map((creator) => (
                      <Link
                        key={creator.displayName}
                        href={creator.id ? `/creators/${creator.id}` : "/charts"}
                        className="block rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45"
                      >
                        <div className="text-sm font-medium">{creator.displayName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">公开作品与风格主页</div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg border border-panel-border bg-black/20 p-3 text-sm text-muted-foreground">
                      暂无匹配创作者
                    </div>
                  )}
                </SearchShelf>
              </aside>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="studio-surface rounded-lg p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Search className="size-5 text-studio-gold" />
                搜索歌曲、创作者、歌单或风格
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
                      <div className="mt-1 text-xs text-muted-foreground">进入该风格频道</div>
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

            <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <div>
                <div className="mb-3 text-lg font-semibold">可以先从这些歌单开始</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {playlists.slice(0, 4).map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlists/${playlist.id}`}
                      className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                    >
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {playlist.owner?.displayName ?? "Melo 编辑部"}
                      </div>
                      <div className="mt-3 text-lg font-semibold">{playlist.title}</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {playlist.tracks.slice(0, 2).map((item) => item.track.title).join(" / ")}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <LocalPublishedTracksShelf title="最近发布" />
                <SearchShelf title="创作提示词" icon={Compass}>
                  {promptIdeas.map((idea) => (
                    <Link
                      key={idea}
                      href={`/studio/simple?prompt=${encodeURIComponent(idea)}`}
                      className="block rounded-lg border border-panel-border bg-black/20 p-3 text-sm transition hover:border-studio-gold/45"
                    >
                      {idea}
                    </Link>
                  ))}
                </SearchShelf>
              </div>
            </section>
          </div>
        )}
      </StudioShell>
    </>
  );
}

function SearchShelf({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-studio-gold" />
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
