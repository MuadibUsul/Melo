import { api, ApiError } from "@/lib/api/client";
import type { TrackView } from "@/types/music";
import {
  getSeedCreatorChart,
  getSeedGenreChart,
  getSeedHotChart,
  getSeedNewChart,
  getSeedPlaylist,
  getSeedPublicPlaylists,
  getSeedTrack,
  getSeedTracks,
  searchSeedTracks,
} from "./catalog-data";

export interface CatalogTrack {
  id: string;
  title: string;
  genre?: string | null;
  tags: string[];
  playCount: number;
  likeCount: number;
  rank?: number;
  score?: number;
  audioUrl?: string;
  creator: { id: string; displayName: string; avatarKey?: string | null };
  asset?: { id?: string; storageKey: string; durationMs?: number | null };
  publishedAt?: string | null;
}

function toCatalogTrackFromSeed(track: ReturnType<typeof getSeedTracks>[number], index = 0): CatalogTrack {
  return {
    id: track.id,
    title: track.title,
    genre: track.genre,
    tags: track.tags,
    playCount: track.playCount,
    likeCount: track.likeCount,
    rank: index + 1,
    score: track.playCount + track.likeCount * 2,
    audioUrl: track.audioUrl,
    creator: {
      id: track.creator.id,
      displayName: track.creator.displayName,
      avatarKey: null,
    },
    asset: {
      id: track.id,
      storageKey: track.audioUrl,
      durationMs: track.durationMs,
    },
    publishedAt: track.publishedAt,
  };
}

export function isNetworkError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof ApiError && error.code === "BACKEND_UNAVAILABLE") ||
    (error instanceof Error && /failed to fetch|backend unavailable|服务暂时不可用/i.test(error.message))
  );
}

export function toCatalogTrack(track: TrackView, index: number): CatalogTrack {
  const task = Array.isArray(track.generation_tasks) ? track.generation_tasks[0] : track.generation_tasks;

  return {
    id: track.id,
    title: track.title ?? "未命名作品",
    genre: task?.genre ?? null,
    tags: [task?.mood, task?.vocal].filter(Boolean) as string[],
    playCount: 0,
    likeCount: track.favorited ? 1 : 0,
    rank: index + 1,
    score: Math.max(1, 100 - index * 7),
    audioUrl: track.audio_url ?? undefined,
    creator: {
      id: track.user_id,
      displayName: "声成创作者",
      avatarKey: null,
    },
    asset: {
      id: track.id,
      storageKey: track.storage_path ?? track.audio_url ?? "",
      durationMs: track.duration_ms,
    },
    publishedAt: track.created_at ?? null,
  };
}

export async function getTracksWithFallback(backendPath: string): Promise<{ items: CatalogTrack[]; total: number }> {
  try {
    return await api.get<{ items: CatalogTrack[]; total: number }>(backendPath);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const search = backendPath.match(/\/tracks\/search\?q=(.*)$/)?.[1];
    const genre = backendPath.match(/[?&]genre=([^&]+)/)?.[1];
    const items = search
      ? searchSeedTracks(decodeURIComponent(search))
      : genre
        ? getSeedTracks().filter((track) => track.genre === decodeURIComponent(genre))
        : getSeedTracks();
    return { items: items.map(toCatalogTrackFromSeed), total: items.length };
  }
}

export async function getChartWithFallback(type: "hot" | "new"): Promise<{ items: CatalogTrack[] }> {
  try {
    return await api.get<{ items: CatalogTrack[] }>(`/charts/${type}`);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const items = (type === "hot" ? getSeedHotChart() : getSeedNewChart()).map((track, index) =>
      toCatalogTrackFromSeed(track, index),
    );
    return { items };
  }
}

export async function getPlayableUrl(track: CatalogTrack): Promise<string> {
  try {
    const { url } = await api.get<{ url: string }>(`/tracks/${track.id}/play`);
    return url || track.audioUrl || "";
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const seed = getSeedTrack(track.id);
    return seed?.audioUrl || track.audioUrl || "";
  }
}

export {
  getSeedCreatorChart,
  getSeedGenreChart,
  getSeedHotChart,
  getSeedNewChart,
  getSeedPlaylist,
  getSeedPublicPlaylists,
  getSeedTrack,
  getSeedTracks,
};
