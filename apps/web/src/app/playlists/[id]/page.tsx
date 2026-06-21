import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";
import { PlaylistTrackTable } from "@/components/PlaylistTrackTable";
import { getSeedPlaylist, getSeedPublicPlaylists } from "@/lib/fallback/catalog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

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

async function getPlaylist(id: string): Promise<PublicPlaylist | null> {
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
          owner: playlist.owner,
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
    return data.items ?? [];
  } catch {
    return getSeedPublicPlaylists().map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      owner: playlist.owner,
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

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [playlist, allPlaylists] = await Promise.all([getPlaylist(id), getPublicPlaylists()]);

  const morePlaylists = allPlaylists.filter((item) => item.id !== id).slice(0, 4);

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="歌单" title={playlist?.title ?? "歌单"} description={playlist ? playlist.owner.displayName : undefined}>
        {!playlist ? (
          <div className="studio-surface rounded-lg p-4 text-sm text-muted-foreground">歌单不存在</div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-panel-border bg-[linear-gradient(180deg,rgba(233,200,111,0.18),rgba(17,19,23,0.96)_44%)] p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-studio-gold">歌单</div>
                  <h1 className="mt-3 text-4xl font-semibold">{playlist.title}</h1>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{playlist.tracks.length.toLocaleString()} 首曲目</span>
                    <span>{playlist.owner.displayName}</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    ["曲目数量", playlist.tracks.length.toString().padStart(2, "0")],
                    [
                      "累计播放",
                      playlist.tracks.reduce((sum, item) => sum + (item.track.playCount ?? 0), 0).toLocaleString(),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-panel-border bg-black/20 px-4 py-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-2 text-lg font-semibold">{value}</div>
                    </div>
                  ))}
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
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {item.track.genre || "单曲"}
                      </div>
                      <div className="mt-3 text-lg font-semibold">{item.track.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.track.creator.displayName}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="studio-surface rounded-lg p-5">
                <div className="mb-4 text-lg font-semibold">继续浏览</div>
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
              </div>
            </section>
          </div>
        )}
      </StudioShell>
    </>
  );
}
