import Link from "next/link";
import type { Metadata } from "next";
import { AudioLines, GitBranch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocalTrackDetail } from "@/components/LocalTrackDetail";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { TrackInteractiveSection } from "@/components/TrackInteractiveSection";
import { formatMeloName } from "@/lib/brand";
import { getSeedPublicPlaylists, getSeedTrack, getSeedTracks } from "@/lib/fallback/catalog";

interface TrackDetail {
  id: string;
  title: string;
  description?: string | null;
  lyrics?: string | null;
  genre?: string | null;
  tags: string[];
  isAiGenerated: boolean;
  playCount: number;
  likeCount: number;
  commentCount: number;
  creator: { id: string; displayName: string };
  asset?: { storageKey?: string | null; streamKey?: string | null; durationMs?: number | null };
}

interface RelatedTrack {
  id: string;
  title: string;
  genre?: string | null;
  playCount: number;
  creator: { id: string; displayName: string };
}

interface PublicPlaylist {
  id: string;
  title: string;
  owner: { displayName: string };
  tracks: Array<{ track: { id: string; title: string } }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://melo.local").replace(/\/$/, "");

type TrackPageProps = { params: Promise<{ id: string }> };

function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

function formatIsoDuration(ms?: number | null) {
  if (!ms) return undefined;
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `PT${minutes}M${seconds}S`;
}

function getTrackJsonLd(track: TrackDetail, audioUrl: string | null) {
  const url = absoluteUrl(`/song/${track.id}`);
  const duration = formatIsoDuration(track.asset?.durationMs);
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${url}#music-recording`,
    name: track.title,
    description: track.description ?? `${track.creator.displayName} on Melo`,
    url,
    inLanguage: "zh-CN",
    genre: track.genre ?? undefined,
    keywords: track.tags.join(", "),
    duration,
    isAccessibleForFree: true,
    isFamilyFriendly: true,
    byArtist: {
      "@type": "MusicGroup",
      name: track.creator.displayName,
      url: absoluteUrl(`/creators/${track.creator.id}`),
    },
    publisher: {
      "@type": "Organization",
      name: "Melo",
      url: SITE_URL,
    },
    encoding: audioUrl
      ? {
          "@type": "AudioObject",
          contentUrl: audioUrl,
          encodingFormat: "audio/mpeg",
        }
      : undefined,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ListenAction",
        userInteractionCount: track.playCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: track.likeCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: track.commentCount,
      },
    ],
  };
}

async function getBackendTrack(id: string): Promise<TrackDetail | null> {
  try {
    const response = await fetch(`${API_BASE}/tracks/${id}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<TrackDetail>;
  } catch {
    const track = getSeedTrack(id);
    return track
      ? {
          id: track.id,
          title: track.title,
          description: track.description,
          lyrics: track.lyrics ?? null,
          genre: track.genre,
          tags: track.tags,
          isAiGenerated: track.isAiGenerated,
          playCount: track.playCount,
          likeCount: track.likeCount,
          commentCount: track.commentCount,
          creator: { id: track.creator.id, displayName: track.creator.displayName },
          asset: { storageKey: track.audioUrl, streamKey: track.audioUrl, durationMs: track.durationMs },
        }
      : null;
  }
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { id } = await params;
  const track = await getBackendTrack(id);
  if (!track) {
    return {
      title: "Melo 作品",
      description: "在 Melo 发现中文 AI 音乐作品。",
    };
  }

  const creatorName = formatMeloName(track.creator.displayName);
  const description = track.description || `${creatorName} 在 Melo 发布的 ${track.genre || "AI 音乐"}作品。`;
  const title = `${track.title} - Melo`;
  const url = `/song/${track.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: {
        "application/json+oembed": `/oembed?url=${encodeURIComponent(url)}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "music.song",
      url,
      siteName: "Melo",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

async function getRelatedTracks(id: string, genre?: string | null): Promise<RelatedTrack[]> {
  const seedRelated = () => {
    const seededTracks = getSeedTracks().filter((track) => track.id !== id);
    const sameGenre = genre ? seededTracks.filter((track) => track.genre === genre) : [];
    const candidates = sameGenre.length >= 3 ? sameGenre : seededTracks.sort((a, b) => b.playCount - a.playCount);
    return candidates.slice(0, 6).map((track) => ({
      id: track.id,
      title: track.title,
      genre: track.genre,
      playCount: track.playCount,
      creator: { id: track.creator.id, displayName: track.creator.displayName },
    }));
  };

  try {
    const path = genre ? `/tracks?genre=${encodeURIComponent(genre)}` : "/charts/hot";
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = (await response.json()) as { items?: RelatedTrack[] };
    const items = (data.items ?? []).filter((item) => item.id !== id).slice(0, 6);
    return items.length > 0 ? items : seedRelated();
  } catch {
    return seedRelated();
  }
}

async function getPublicPlaylists(): Promise<PublicPlaylist[]> {
  try {
    const response = await fetch(`${API_BASE}/playlists/public`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = (await response.json()) as { items?: PublicPlaylist[] };
    return (data.items ?? []).map((playlist) => ({
      ...playlist,
      owner: { displayName: formatMeloName(playlist.owner.displayName) },
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

export default async function TrackDetailPage({ params }: TrackPageProps) {
  const { id } = await params;
  const track = await getBackendTrack(id);

  if (!track) {
    return (
      <>
        <MeloMobileTopBar />
        <MeloRail />
        <MeloTopBar />
        <MeloMobileDock />
        <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="作品" title="作品详情">
          <LocalTrackDetail />
        </StudioShell>
      </>
    );
  }

  const audioUrl = track.asset?.streamKey || track.asset?.storageKey || null;
  const trackJsonLd = getTrackJsonLd(track, audioUrl);
  const [relatedTracks, publicPlaylists] = await Promise.all([
    getRelatedTracks(track.id, track.genre),
    getPublicPlaylists(),
  ]);
  const containingPlaylists = publicPlaylists
    .filter((playlist) => playlist.tracks.some((item) => item.track.id === track.id))
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trackJsonLd) }}
      />
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="作品" title={track.title} description={track.description ?? "Melo 原创音乐作品"}>
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
            <div className="studio-surface aspect-square rounded-lg p-6">
              <div className="flex h-full flex-col items-center justify-center rounded-lg bg-studio-gold/10 text-center text-studio-gold">
                <div className="text-xs uppercase tracking-[0.18em] text-studio-gold/80">Track</div>
                <div className="mt-3 max-w-[12rem] text-2xl font-semibold">{track.title}</div>
              </div>
            </div>

            <section className="studio-surface rounded-lg p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {track.genre ? <Badge variant="secondary">{track.genre}</Badge> : null}
                {track.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {track.isAiGenerated ? <Badge variant="outline">AI 生成</Badge> : null}
              </div>
              <Link href={`/creators/${track.creator.id}`} className="text-sm text-studio-gold">
                {track.creator.displayName}
              </Link>
              <div className="mt-5">
                <TrackInteractiveSection
                  id={track.id}
                  title={track.title}
                  artist={track.creator.displayName}
                  audioUrl={audioUrl ?? ""}
                  durationMs={track.asset?.durationMs ?? undefined}
                />
              </div>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div>播放 {track.playCount.toLocaleString()}</div>
                <div>收藏 {track.likeCount.toLocaleString()}</div>
                <div>评论 {track.commentCount.toLocaleString()}</div>
              </div>
              {track.lyrics ? (
                <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-panel-border bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
                  {track.lyrics}
                </pre>
              ) : (
                <div className="mt-6 rounded-lg border border-panel-border bg-black/20 p-4 text-sm text-muted-foreground">
                  这是一首纯音乐作品。
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <section className="studio-surface rounded-lg p-5">
                <div className="mb-4 text-lg font-semibold">收录歌单</div>
                <div className="space-y-2">
                  {containingPlaylists.length > 0 ? (
                    containingPlaylists.map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${playlist.id}`}
                        className="block rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                      >
                        <div className="text-sm font-medium">{playlist.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{playlist.owner.displayName}</div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg border border-panel-border bg-black/20 p-3 text-sm text-muted-foreground">
                      暂无收录歌单
                    </div>
                  )}
                </div>
              </section>

              <section className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <GitBranch className="size-5 text-studio-gold" />
                  创作谱系
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-panel-border bg-black/20 p-3">
                    来自 Melo AI 生成，可继续翻唱、延展、Remix 或打开编辑器。
                  </div>
                  <Link
                    href={`/studio/simple?prompt=${encodeURIComponent(`参考《${track.title}》创作一首新的中文歌曲`)}`}
                    className="flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45 hover:text-foreground"
                  >
                    <Sparkles className="size-4 text-studio-gold" />
                    参考这首歌创作
                  </Link>
                  <Link
                    href={`/studio/editor?source=${encodeURIComponent(track.id)}`}
                    className="flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45 hover:text-foreground"
                  >
                    <AudioLines className="size-4 text-studio-gold" />
                    进入歌曲编辑器
                  </Link>
                </div>
              </section>
            </aside>
          </div>

          {relatedTracks.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">继续收听</h2>
                {track.genre ? (
                  <Link href={`/categories?genre=${encodeURIComponent(track.genre)}`} className="text-sm text-studio-gold">
                    {track.genre}
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {relatedTracks.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tracks/${item.id}`}
                    className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                  >
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {item.genre || "单曲"}
                    </div>
                    <div className="mt-3 text-lg font-semibold">{item.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.creator.displayName}</div>
                    <div className="mt-4 text-xs text-muted-foreground">播放 {item.playCount.toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </StudioShell>
    </>
  );
}
