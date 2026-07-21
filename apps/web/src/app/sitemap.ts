import type { MetadataRoute } from "next";
import { getSeedCreatorChart, getSeedPublicPlaylists, getSeedTracks } from "@/lib/fallback/catalog";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://melo.local").replace(/\/$/, "");

function absolute(path: string) {
  return `${SITE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absolute("/discover"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absolute("/create"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absolute("/charts"), lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: absolute("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: absolute("/explore"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: absolute("/hooks"), lastModified: now, changeFrequency: "weekly", priority: 0.65 },
    { url: absolute("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: absolute("/terms"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const trackRoutes = getSeedTracks().flatMap((track) => {
    const lastModified = new Date(track.publishedAt);
    return [
      {
        url: absolute(`/song/${track.id}`),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: absolute(`/tracks/${track.id}`),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ];
  });

  const playlistRoutes = getSeedPublicPlaylists().map((playlist) => ({
    url: absolute(`/playlists/${playlist.id}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  const creatorRoutes = getSeedCreatorChart().map((item) => ({
    url: absolute(`/creators/${item.creatorId}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...trackRoutes, ...playlistRoutes, ...creatorRoutes];
}
