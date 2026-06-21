"use client";

import { useState } from "react";
import Link from "next/link";
import { Mic2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { StudioNav } from "@/components/StudioNav";
import { usePlayerStore } from "@/lib/player/use-player-store";

const VOICES = [
  { id: "sweet_female", label: "甜美女声", desc: "温柔、清新，适合流行与情感类曲目", sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "deep_male", label: "浑厚男声", desc: "低沉有力，适合摇滚、说唱与影视配乐", sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "soft_female", label: "温柔女声", desc: "舒缓柔和，适合国风、古典与冥想类曲目", sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "youth_male", label: "青年男声", desc: "阳光活力，适合流行、电子与轻快曲目", sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  { id: "child", label: "童声", desc: "纯净自然，适合儿歌与清新风格曲目", sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "narration", label: "旁白音色", desc: "干净中性，适合 TTS 朗读与有声读物", sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
];

export default function StudioVoicesPage() {
  const player = usePlayerStore();
  const [playing, setPlaying] = useState<string | null>(null);

  function previewVoice(voice: (typeof VOICES)[number]) {
    if (playing === voice.id) {
      player.pause();
      setPlaying(null);
      return;
    }
    player.play({ id: voice.id, title: voice.label, artist: "音色试听", audioUrl: voice.sample });
    setPlaying(voice.id);
  }

  return (
    <>
      <SiteNav />
      <main className="studio-backdrop min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-lg border border-panel-border bg-black/20 px-3 py-1 text-xs uppercase text-studio-gold">音色</div>
            <h1 className="text-3xl font-semibold">音色选择</h1>
            <p className="mt-2 text-sm text-muted-foreground">选择人声风格，点击试听后前往工作台使用。</p>
          </div>
          <StudioNav />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {VOICES.map((voice) => (
              <div key={voice.id} className="studio-surface rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-studio-gold/10">
                      <Mic2 className="size-4 text-studio-gold" />
                    </div>
                    <div>
                      <div className="font-semibold">{voice.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{voice.desc}</div>
                    </div>
                  </div>
                  <Button
                    variant={playing === voice.id ? "secondary" : "outline"}
                    size="icon-sm"
                    onClick={() => previewVoice(voice)}
                    title="试听"
                  >
                    <Play className="size-3.5" />
                  </Button>
                </div>
                <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
                  <Link href={`/studio/simple?vocal=${encodeURIComponent(voice.label)}`}>
                    使用此音色创作
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
