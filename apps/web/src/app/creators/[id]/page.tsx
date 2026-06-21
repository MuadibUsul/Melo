import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { PlaylistTrackTable } from "@/components/PlaylistTrackTable";
import { getSeedTracksByCreator } from "@/lib/fallback/catalog-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface CreatorTrack {
  id: string;
  title: string;
  description?: string | null;
  playCount: number;
  likeCount: number;
  creatorId: string;
  creator?: { id: string; displayName: string };
  genre?: string | null;
  audioUrl?: string | null;
  durationMs?: number | null;
}

async function getCreatorTracks(creatorId: string): Promise<{ items: CreatorTrack[]; total: number }> {
  try {
    const response = await fetch(`${API_BASE}/tracks/creator/${creatorId}`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    return response.json();
  } catch {
    const data = getSeedTracksByCreator(creatorId);
    return {
      items: data.items.map((track) => ({
        id: track.id,
        title: track.title,
        description: track.description,
        playCount: track.playCount,
        likeCount: track.likeCount,
        creatorId: track.creator.id,
        creator: { id: track.creator.id, displayName: track.creator.displayName },
        genre: track.genre,
        audioUrl: track.audioUrl,
        durationMs: track.durationMs,
      })),
      total: data.total,
    };
  }
}

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCreatorTracks(id);
  const creatorName = data.items[0]?.creator?.displayName ?? "创作者";
  const totalPlays = data.items.reduce((sum, item) => sum + item.playCount, 0);
  const totalLikes = data.items.reduce((sum, item) => sum + item.likeCount, 0);

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="创作者" title={creatorName}>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(180deg,rgba(233,200,111,0.22),rgba(17,19,23,0.96)_46%)] p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">创作者</div>
            <h1 className="mt-3 text-4xl font-semibold">{creatorName}</h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} 首作品</span>
              <span>{totalPlays.toLocaleString()} 次播放</span>
              <span>{totalLikes.toLocaleString()} 次收藏</span>
            </div>
          </section>
          <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="studio-surface rounded-lg p-4">
              <div className="text-2xl font-semibold">{data.total}</div>
              <div className="text-sm text-muted-foreground">作品</div>
            </div>
            <div className="studio-surface rounded-lg p-4">
              <div className="text-2xl font-semibold">{totalPlays.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">播放</div>
            </div>
            <div className="studio-surface rounded-lg p-4">
              <div className="text-2xl font-semibold">{totalLikes.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">收藏</div>
            </div>
          </section>
        </div>

        {data.items.length === 0 ? (
          <div className="studio-surface rounded-lg p-4 text-sm text-muted-foreground">暂无公开作品</div>
        ) : (
          <PlaylistTrackTable
            title={creatorName}
            href={`/creators/${id}`}
            tracks={data.items.map((track) => ({
              id: track.id,
              title: track.title,
              genre: track.genre,
              artist: creatorName,
              audioUrl: track.audioUrl || "",
              durationMs: track.durationMs ?? null,
              playCount: track.playCount,
              likeCount: track.likeCount,
            }))}
          />
        )}
      </StudioShell>
    </>
  );
}
