"use client";

import dynamic from "next/dynamic";

const TrackDetailActions = dynamic(
  () => import("@/components/TrackDetailActions").then((module) => module.TrackDetailActions),
  {
    ssr: false,
    loading: () => <div className="h-11 rounded-lg border border-panel-border bg-black/20" />,
  },
);

const TrackComments = dynamic(
  () => import("@/components/TrackComments").then((module) => module.TrackComments),
  {
    ssr: false,
    loading: () => (
      <section className="studio-surface rounded-lg p-5 text-sm text-muted-foreground">
        {"\u52a0\u8f7d\u8bc4\u8bba\u4e2d"}
      </section>
    ),
  },
);

export function TrackInteractiveSection({
  id,
  title,
  artist,
  audioUrl,
  durationMs,
}: {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  durationMs?: number;
}) {
  return (
    <div className="space-y-6">
      <TrackDetailActions
        id={id}
        title={title}
        artist={artist}
        audioUrl={audioUrl}
        durationMs={durationMs}
      />
      <TrackComments trackId={id} />
    </div>
  );
}
