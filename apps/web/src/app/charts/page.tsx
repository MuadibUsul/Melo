import Link from "next/link";
import { ChartList } from "@/components/ChartList";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
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
      likeCount: item.likeCount,
    }));
  }
}

async function getGenreChart(genre: string): Promise<TrackChartItem[]> {
  try {
    const response = await fetch(`${API_BASE}/charts/genre?genre=${encodeURIComponent(genre)}`, { cache: "no-store" });
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
      <SiteNav />
      <StudioShell eyebrow="榜单" title="榜单">
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
            <div className="mb-3 text-sm font-semibold">创作者上升榜</div>
            <div className="space-y-2">
              {creators.map((item) => (
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
                      {item.trackCount} 首作品 · {item.playCount.toLocaleString()} 播放
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.likeCount.toLocaleString()} 收藏</div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <GenreChartCard title="中文流行热榜" items={popChart} />
          <GenreChartCard title="影视配乐热榜" items={soundtrackChart} />
        </div>
      </StudioShell>
    </>
  );
}

function GenreChartCard({ title, items }: { title: string; items: TrackChartItem[] }) {
  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, index) => (
          <Link
            key={item.id}
            href={`/tracks/${item.id}`}
            className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
          >
            <div>
              <div className="text-sm font-medium">
                {index + 1}. {item.title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{item.creator.displayName}</div>
            </div>
            <div className="text-xs text-muted-foreground">{item.genre || "未分类"}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
