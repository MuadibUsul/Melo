import Link from "next/link";
import type { Metadata } from "next";
import { Disc3, Headphones, Library, ListMusic, Sparkles, Trophy } from "lucide-react";
import { PlaylistActions } from "@/components/PlaylistActions";
import { PlaylistTrackTable } from "@/components/PlaylistTrackTable";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { formatMeloName } from "@/lib/brand";
import { getSeedPlaylist, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://melo.local").replace(/\/$/, "");

type PlaylistPageProps = { params: Promise<{ id: string }> };

interface PlaylistTrack {
  track: {
    id: string;
    title: string;
    genre?: string | null;
    tags: string[];
    playCount?: number;
    likeCount?: number;
    creator: { id: string; displayName: string };
    asset?: { storageKey?: string | null; streamKey?: string | null; durationMs?: number | null };
  };
}

interface PublicPlaylist {
  id: string;
  title: string;
  owner: { id: string; displayName: string };
  tracks: PlaylistTrack[];
}

function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

function getPlaylistDescription(playlist: PublicPlaylist) {
  return `${playlist.owner.displayName} 在 Melo 精选的 ${playlist.tracks.length} 首中文 AI 音乐。`;
}

function getPlaylistJsonLd(playlist: PublicPlaylist) {
  const url = absoluteUrl(`/playlists/${playlist.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    "@id": `${url}#music-playlist`,
    name: playlist.title,
    description: getPlaylistDescription(playlist),
    url,
    inLanguage: "zh-CN",
    numTracks: playlist.tracks.length,
    creator: {
      "@type": "Person",
      name: playlist.owner.displayName,
    },
    publisher: {
      "@type": "Organization",
      name: "Melo",
      url: SITE_URL,
    },
    track: playlist.tracks.map((item, index) => ({
      "@type": "MusicRecording",
      position: index + 1,
      name: item.track.title,
      url: absoluteUrl(`/song/${item.track.id}`),
      genre: item.track.genre ?? undefined,
      byArtist: {
        "@type": "MusicGroup",
        name: item.track.creator.displayName,
        url: absoluteUrl(`/creators/${item.track.creator.id}`),
      },
    })),
  };
}

async function getPlaylist(id: string): Promise<PublicPlaylist | null> {
  try {
    const response = await fetch(`${API_BASE}/playlists/public/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const playlist = (await response.json()) as PublicPlaylist;
    return {
      ...playlist,
      owner: { ...playlist.owner, displayName: formatMeloName(playlist.owner.displayName) },
    };
  } catch {
    const playlist = getSeedPlaylist(id);
    return playlist
      ? {
          id: playlist.id,
          title: playlist.title,
          owner: { ...playlist.owner, displayName: formatMeloName(playlist.owner.displayName) },
          tracks: playlist.tracks.map((item) => ({
            track: {
              id: item.track.id,
              title: item.track.title,
              genre: item.track.genre,
              tags: item.track.tags,
              playCount: item.track.playCount,
              likeCount: item.track.likeCount,
              creator: { id: item.track.creator.id, displayName: item.track.creator.displayName },
              asset: {
                storageKey: item.track.audioUrl,
                streamKey: item.track.audioUrl,
                durationMs: item.track.durationMs,
              },
            },
          })),
        }
      : null;
  }
}

async function getPublicPlaylists(): Promise<PublicPlaylist[]> {
  try {
    const response = await fetch(`${API_BASE}/playlists/public`, { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = (await response.json()) as { items?: PublicPlaylist[] };
    return (data.items ?? []).map((playlist) => ({
      ...playlist,
      owner: { ...playlist.owner, displayName: formatMeloName(playlist.owner.displayName) },
    }));
  } catch {
    return getSeedPublicPlaylists().map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      owner: { ...playlist.owner, displayName: formatMeloName(playlist.owner.displayName) },
      tracks: playlist.tracks.map((item) => ({
        track: {
          id: item.track.id,
          title: item.track.title,
          genre: item.track.genre,
          tags: item.track.tags,
          playCount: item.track.playCount,
          likeCount: item.track.likeCount,
          creator: { id: item.track.creator.id, displayName: item.track.creator.displayName },
          asset: {
            storageKey: item.track.audioUrl,
            streamKey: item.track.audioUrl,
            durationMs: item.track.durationMs,
          },
        },
      })),
    }));
  }
}

export async function generateMetadata({ params }: PlaylistPageProps): Promise<Metadata> {
  const { id } = await params;
  const playlist = await getPlaylist(id);
  if (!playlist) {
    return {
      title: "Melo 歌单",
      description: "在 Melo 发现中文 AI 音乐歌单。",
    };
  }

  const title = `${playlist.title} - Melo`;
  const description = getPlaylistDescription(playlist);
  const url = `/playlists/${playlist.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "music.playlist",
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

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const [playlist, allPlaylists] = await Promise.all([getPlaylist(id), getPublicPlaylists()]);
  const morePlaylists = allPlaylists.filter((item) => item.id !== id).slice(0, 4);

  if (!playlist) {
    return (
      <>
        <MeloMobileTopBar />
        <MeloRail />
        <MeloTopBar />
        <MeloMobileDock />
        <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="歌单" title="歌单">
          <div className="studio-surface rounded-lg p-4 text-sm text-muted-foreground">歌单不存在</div>
        </StudioShell>
      </>
    );
  }

  const totalPlays = playlist.tracks.reduce((sum, item) => sum + (item.track.playCount ?? 0), 0);
  const totalLikes = playlist.tracks.reduce((sum, item) => sum + (item.track.likeCount ?? 0), 0);
  const genres = Array.from(
    new Set(playlist.tracks.map((item) => item.track.genre).filter((genre): genre is string => Boolean(genre))),
  ).slice(0, 6);
  const playlistJsonLd = getPlaylistJsonLd(playlist);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(playlistJsonLd) }}
      />
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="歌单" title={playlist.title} description={`由 ${playlist.owner.displayName} 精选`}>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(145deg,rgba(233,200,111,0.22),rgba(17,19,23,0.96)_45%,rgba(39,224,167,0.10))] p-6">
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
              <div className="aspect-square rounded-lg border border-panel-border bg-black/30 p-5">
                <div className="flex h-full flex-col items-center justify-center rounded-lg bg-studio-gold/10 text-center text-studio-gold">
                  <ListMusic className="size-10" />
                  <div className="mt-3 text-xs uppercase tracking-[0.18em]">Playlist</div>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-studio-gold/30 bg-black/20 px-3 py-1 text-xs text-studio-gold">
                  <Sparkles className="size-3.5" />
                  Melo 精选歌单
                </div>
                <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{playlist.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  从 Melo 公开曲库中精选的中文 AI 音乐集合，适合连续播放、保存、分享，或作为下一首创作的灵感来源。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Link
                      key={genre}
                      href={`/categories?genre=${encodeURIComponent(genre)}`}
                      className="rounded-full border border-panel-border bg-black/20 px-3 py-1 text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
                <div className="mt-5">
                  <PlaylistActions title={playlist.title} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MetricCard icon={Disc3} label="曲目" value={playlist.tracks.length.toString().padStart(2, "0")} />
                <MetricCard icon={Headphones} label="累计播放" value={totalPlays.toLocaleString()} />
                <MetricCard icon={Trophy} label="累计收藏" value={totalLikes.toLocaleString()} />
              </div>
            </div>
          </section>

          <PlaylistTrackTable
            title={playlist.title}
            href={`/playlists/${playlist.id}`}
            tracks={playlist.tracks.map((item) => ({
              id: item.track.id,
              title: item.track.title,
              genre: item.track.genre,
              artist: item.track.creator.displayName,
              audioUrl: item.track.asset?.streamKey || item.track.asset?.storageKey || "",
              durationMs: item.track.asset?.durationMs ?? null,
              playCount: item.track.playCount ?? 0,
              likeCount: item.track.likeCount ?? 0,
            }))}
          />

          <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-3 text-lg font-semibold">来自这张歌单</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {playlist.tracks.slice(0, 6).map((item) => (
                  <Link
                    key={item.track.id}
                    href={`/tracks/${item.track.id}`}
                    className="studio-surface rounded-lg p-4 transition hover:border-studio-gold/45"
                  >
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {item.track.genre || "单曲"}
                    </div>
                    <div className="mt-3 text-lg font-semibold">{item.track.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.track.creator.displayName}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <section className="studio-surface rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Library className="size-5 text-studio-gold" />
                  继续浏览
                </div>
                <div className="space-y-2">
                  {morePlaylists.map((item) => (
                    <Link
                      key={item.id}
                      href={`/playlists/${item.id}`}
                      className="block rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
                    >
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.owner.displayName}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="studio-surface rounded-lg p-5">
                <div className="mb-3 text-lg font-semibold">用这张歌单创作</div>
                <p className="text-sm leading-6 text-muted-foreground">
                  参考歌单里的风格、节奏和主题，生成一首新的中文 AI 歌曲。
                </p>
                <Link
                  href={`/studio/simple?prompt=${encodeURIComponent(`参考歌单《${playlist.title}》的氛围，创作一首新的中文歌曲`)}`}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-panel-border px-3 text-sm transition hover:border-studio-gold/45"
                >
                  生成相似歌曲
                </Link>
              </section>
            </div>
          </section>
        </div>
      </StudioShell>
    </>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Disc3; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-panel-border bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className="size-4 text-studio-gold" />
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
