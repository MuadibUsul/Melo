import Link from "next/link";
import { AudioLines, BadgeCheck, Compass, Heart, Library, Mic2, PlayCircle, Sparkles, Trophy } from "lucide-react";
import { CreatorProfileActions } from "@/components/CreatorProfileActions";
import { PlaylistTrackTable } from "@/components/PlaylistTrackTable";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";
import { getSeedTracksByCreator } from "@/lib/fallback/catalog-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface CreatorTrack {
  id: string;
  title: string;
  description?: string | null;
  playCount: number;
  likeCount: number;
  creatorId: string;
  creator?: { id: string; displayName: string; style?: string | null; bio?: string | null };
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
        creator: {
          id: track.creator.id,
          displayName: track.creator.displayName,
          style: track.creator.style,
          bio: track.creator.bio,
        },
        genre: track.genre,
        audioUrl: track.audioUrl,
        durationMs: track.durationMs,
      })),
      total: data.total,
    };
  }
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCreatorTracks(id);
  const firstTrack = data.items[0];
  const creatorName = firstTrack?.creator?.displayName ?? "Melo 创作者";
  const creatorStyle = firstTrack?.creator?.style ?? firstTrack?.genre ?? "AI 音乐";
  const creatorBio =
    firstTrack?.creator?.bio ??
    "这位创作者正在用 Melo 探索旋律、歌词、声音人设和 AI 编曲，把灵感发布成可播放的作品。";
  const totalPlays = data.items.reduce((sum, item) => sum + item.playCount, 0);
  const totalLikes = data.items.reduce((sum, item) => sum + item.likeCount, 0);
  const topTrack = data.items.slice().sort((a, b) => b.playCount - a.playCount)[0];
  const styleTags = unique([
    creatorStyle,
    ...data.items.map((item) => item.genre),
    data.items.length > 0 ? "AI 生成" : null,
    data.items.length > 2 ? "持续发布" : null,
  ]).slice(0, 6);

  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="创作者"
        title={creatorName}
        description="查看创作者的公开作品、风格身份、代表作和播放数据。"
      >
        <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.24),rgba(17,19,23,0.96)_45%,rgba(39,224,167,0.10))] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-black/20 px-3 py-1 text-xs text-studio-gold">
                  <BadgeCheck className="size-3.5" />
                  Melo Creator
                </div>
                <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{creatorName}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{creatorBio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {styleTags.map((tag) => (
                    <span key={tag} className="rounded-full border border-panel-border bg-black/20 px-3 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <CreatorProfileActions creatorName={creatorName} />
            </div>
          </section>

          <aside className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard icon={Library} label="作品" value={data.total.toLocaleString()} />
            <MetricCard icon={PlayCircle} label="播放" value={totalPlays.toLocaleString()} />
            <MetricCard icon={Heart} label="收藏" value={totalLikes.toLocaleString()} />
          </aside>
        </div>

        <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Featured</div>
                <h2 className="mt-1 text-lg font-semibold">代表作</h2>
              </div>
              <Trophy className="size-5 text-studio-gold" />
            </div>
            {topTrack ? (
              <Link
                href={`/tracks/${topTrack.id}`}
                className="block rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45"
              >
                <div className="text-xs text-muted-foreground">{topTrack.genre ?? "单曲"}</div>
                <div className="mt-2 text-2xl font-semibold">{topTrack.title}</div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {topTrack.description ?? "来自 Melo 的公开 AI 音乐作品。"}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  播放 {topTrack.playCount.toLocaleString()} / 收藏 {topTrack.likeCount.toLocaleString()}
                </div>
              </Link>
            ) : (
              <div className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm text-muted-foreground">暂无代表作</div>
            )}
          </div>

          <div className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-studio-gold" />
              风格身份
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "主风格", value: creatorStyle, icon: AudioLines },
                { label: "作品数量", value: `${data.total} 首`, icon: Library },
                { label: "创作入口", value: "Remix / 翻唱 / 延展", icon: Mic2 },
                { label: "发现来源", value: "公开曲库与榜单", icon: Compass },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-panel-border bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="size-3.5 text-studio-gold" />
                      {item.label}
                    </div>
                    <div className="mt-2 text-sm font-medium">{item.value}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/studio/simple?prompt=${encodeURIComponent(`参考 ${creatorName} 的风格，创作一首新的中文歌曲`)}`}>
                  参考风格创作
                </Link>
              </Button>
              {topTrack ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/studio/pro?source=${encodeURIComponent(topTrack.id)}&mode=extend`}>延展代表作</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

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

function MetricCard({ icon: Icon, label, value }: { icon: typeof Library; label: string; value: string }) {
  return (
    <div className="studio-surface rounded-lg p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className="size-4 text-studio-gold" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}
