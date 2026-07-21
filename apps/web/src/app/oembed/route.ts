import { getSeedTrack } from "@/lib/fallback/catalog";

interface OEmbedTrack {
  id: string;
  title: string;
  creator: { displayName: string };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

function extractTrackId(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/(?:song|tracks|embed)\/([^/?#]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    const match = url.match(/^\/(?:song|tracks|embed)\/([^/?#]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

async function getOEmbedTrack(id: string): Promise<OEmbedTrack | null> {
  try {
    const response = await fetch(`${API_BASE}/tracks/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (response.ok) return response.json() as Promise<OEmbedTrack>;
  } catch {
    // The public catalog still works without the backend.
  }

  const seed = getSeedTrack(id);
  return seed ? { id: seed.id, title: seed.title, creator: { displayName: seed.creator.displayName } } : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const trackId = extractTrackId(requestUrl.searchParams.get("url"));
  if (!trackId) {
    return Response.json({ error: "A valid Melo song, track, or embed URL is required." }, { status: 400 });
  }

  const track = await getOEmbedTrack(trackId);
  if (!track) {
    return Response.json({ error: "Track not found." }, { status: 404 });
  }

  const origin = requestUrl.origin;
  const embedUrl = new URL(`/embed/${encodeURIComponent(track.id)}`, origin).toString();
  const songUrl = new URL(`/song/${encodeURIComponent(track.id)}`, origin).toString();
  const html = `<iframe title="${track.title} - Melo" src="${embedUrl}" width="100%" height="180" loading="lazy" allow="autoplay; clipboard-write"></iframe>`;

  return Response.json(
    {
      type: "rich",
      version: "1.0",
      provider_name: "Melo",
      provider_url: origin,
      title: `${track.title} - Melo`,
      author_name: track.creator.displayName,
      html,
      width: 480,
      height: 180,
      cache_age: 3600,
      url: songUrl,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
