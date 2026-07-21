import Link from "next/link";
import { ArrowRight, Crown, Flame, Radio, Sparkles } from "lucide-react";
import { ChartList } from "@/components/ChartList";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { serverFetch } from "@/lib/api/server-fetch";
import { getSeedCreatorChart, getSeedGenreChart } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface CreatorChartItem {
  rank: number;
  creatorId: string;
  creator: { id: string; displayName: string };
  trackCount: number;
  playCount: number;
  likeCount: number;
}

interface TrackChartItem {
  id: string;
  title: string;
  genre?: string | null;
  creator: { id: string; displayName: string };
}

async function getCreatorChart(): Promise<CreatorChartItem[]> {
  try {
    const response = await serverFetch(`${API_BASE}/charts/creators`, { cache: "no-store" });
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
      likeCount: item.likeCount,
    }));
  }
}

async function getGenreChart(genre: string): Promise<TrackChartItem[]> {
  try {
    const response = await serverFetch(`${API_BASE}/charts/genre?genre=${encodeURIComponent(genre)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return getSeedGenreChart(genre).map((item) => ({
      id: item.id,
      title: item.title,
      genre: item.genre,
      creator: { id: item.creator.id, displayName: item.creator.displayName },
    }));
  }
}

export default async function ChartsPage() {
  const [creators, popChart, soundtrackChart] = await Promise.all([
    getCreatorChart(),
    getGenreChart("中文流行"),
    getGenreChart("影视配乐"),
  ]);

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="榜单"
        title="Melo 榜单"
        description="实时查看热门歌曲、新发布作品、上升创作者，以及不同风格里的趋势作品。"
      >
        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "热播", value: "Hot 50", icon: Flame, href: "/charts" },
            { label: "新歌", value: "Fresh", icon: Sparkles, href: "/charts" },
            { label: "创作者", value: "Rising", icon: Crown, href: "/search?q=创作者" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                  <Icon className="size-4 text-studio-gold" />
                </div>
                <div className="mt-3 text-2xl font-semibold">{item.value}</div>
              </Link>
            );
          })}
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="studio-surface rounded-lg p-5">
              <ChartList type="hot" />
            </div>
            <div className="studio-surface rounded-lg p-5">
              <ChartList type="new" />
            </div>
          </section>

          <section className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Crown className="size-5 text-studio-gold" />
                创作者上升榜
              </div>
              <Link href="/search?q=创作者" className="inline-flex items-center gap-1 text-sm text-studio-gold">
                查看更多
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {creators.slice(0, 10).map((item) => (
                <Link
                  key={item.creatorId}
                  href={`/creators/${item.creatorId}`}
                  className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {item.rank}. {item.creator.displayName}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.trackCount} 首作品 / {item.playCount.toLocaleString()} 播放
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.likeCount.toLocaleString()} 收藏</div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <GenreChartCard title="中文流行热榜" items={popChart} genre="中文流行" />
          <GenreChartCard title="影视配乐热榜" items={soundtrackChart} genre="影视配乐" />
        </div>
      </StudioShell>
    </>
  );
}

function GenreChartCard({ title, items, genre }: { title: string; items: TrackChartItem[]; genre: string }) {
  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Radio className="size-5 text-meter-green" />
          {title}
        </div>
        <Link href={`/categories?genre=${encodeURIComponent(genre)}`} className="text-sm text-studio-gold">
          进入频道
        </Link>
      </div>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, index) => (
          <Link
            key={item.id}
            href={`/tracks/${item.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {index + 1}. {item.title}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{item.creator.displayName}</div>
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">{item.genre || "未分类"}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
