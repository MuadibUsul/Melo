import Link from "next/link";
import { Headphones, Radio, Sparkles, Waves } from "lucide-react";
import { ChartList } from "@/components/ChartList";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { TrackList } from "@/components/TrackList";
import { getSeedHotChart, getSeedNewChart, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const genres = [
  "中文流行",
  "国风",
  "R&B",
  "电子",
  "Lo-fi",
  "纯音乐",
  "影视配乐",
  "游戏配乐",
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
  creator: { id: string; displayName: string };
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

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="发现" title="发现音乐">
        <section className="mb-6 overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(180deg,rgba(233,200,111,0.18),rgba(17,19,23,0.96)_42%)] p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">发现</div>
              <h2 className="mt-3 text-3xl font-semibold">从热门趋势、风格分类和新曲里继续找歌</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {hotTracks.slice(0, 6).map((track) => (
                  <Link
                    key={track.id}
                    href={`/tracks/${track.id}`}
                    className="rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45"
                  >
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{track.creator.displayName}</div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["风格", genres.length.toString()],
                ["更新", "实时"],
                ["推荐歌单", playlists.length.toString().padStart(2, "0")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-panel-border bg-black/20 px-4 py-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-2 text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Radio className="size-5 text-studio-gold" />
              分类入口
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/categories?genre=${encodeURIComponent(genre)}`}
                  className="rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45"
                >
                  <div className="font-medium">{genre}</div>
                  <div className="mt-1 text-xs text-muted-foreground">进入分类</div>
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
        </div>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="size-5 text-studio-gold" />
                编辑推荐歌单
              </div>
              <Link href="/library" className="text-sm text-studio-gold">
                浏览更多
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {playlists.slice(0, 6).map((playlist) => (
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
                  <div className="mt-4 text-xs text-muted-foreground">{playlist.tracks.length} 首曲目</div>
                </Link>
              ))}
            </div>
          </div>

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
        </section>

        <section className="mt-6">
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
