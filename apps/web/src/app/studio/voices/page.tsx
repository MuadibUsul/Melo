"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Mic2, Play, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";
import { usePlayerStore } from "@/lib/player/use-player-store";

const VOICES = [
  {
    id: "sweet_female",
    label: "清亮女声",
    desc: "明亮、温柔、适合中文流行和情绪副歌。",
    persona: "城市夜行者",
    sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "deep_male",
    label: "低沉男声",
    desc: "厚实、有力量，适合摇滚、说唱和影视配乐。",
    persona: "午夜叙事者",
    sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "soft_female",
    label: "温柔女声",
    desc: "舒缓柔和，适合国风、古典融合和冥想类作品。",
    persona: "月下写信人",
    sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "youth_male",
    label: "青年男声",
    desc: "阳光、干净、有速度感，适合流行、电子和轻快曲目。",
    persona: "夏日主唱",
    sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  {
    id: "choir",
    label: "合唱声场",
    desc: "宽阔、层次感强，适合副歌堆叠、史诗桥段和团队主题。",
    persona: "合唱团",
    sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "narration",
    label: "旁白音色",
    desc: "干净中性，适合 TTS 朗读、有声读物和口播段落。",
    persona: "讲述者",
    sample: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
];

const voiceTips = [
  "使用通用音色描述，不模仿真实歌手或明星声音。",
  "先试听音色，再把人声方向带入快速创作或自定义创作。",
  "同一歌词可以用不同音色生成多个版本，再进入项目页比较。",
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
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="声音" title="声音与人设" description="试听通用人声音色，选择适合歌曲情绪的人设方向，再带入创作台。">
        <StudioNav />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {VOICES.map((voice) => (
              <div key={voice.id} className="studio-surface rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-studio-gold/10">
                      <Mic2 className="size-4 text-studio-gold" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{voice.label}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{voice.persona}</div>
                    </div>
                  </div>
                  <Button
                    variant={playing === voice.id ? "secondary" : "outline"}
                    size="icon-sm"
                    onClick={() => previewVoice(voice)}
                    title="试听"
                    aria-label={`试听 ${voice.label}`}
                  >
                    <Play className="size-3.5" />
                  </Button>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">{voice.desc}</p>
                <div className="mt-4 grid gap-2">
                  <Button asChild size="sm">
                    <Link href={`/studio/simple?vocal=${encodeURIComponent(voice.label)}`}>使用此音色创作</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/studio/pro?vocal=${encodeURIComponent(voice.label)}`}>进入自定义创作</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="studio-surface rounded-lg p-5">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <UserRound className="size-4 text-studio-gold" />
                人设笔记
              </div>
              <div className="mt-4 space-y-3">
                {voiceTips.map((tip, index) => (
                  <div key={tip} className="rounded-lg border border-panel-border bg-black/20 p-3 text-sm leading-6 text-muted-foreground">
                    <span className="mr-2 font-mono text-xs text-studio-gold">0{index + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
            <div className="studio-surface rounded-lg p-5">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Bell className="size-4 text-meter-green" />
                声音更新
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                后续可在这里保存自己的音色偏好、常用人设和项目默认声音。
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/account">查看账号设置</Link>
              </Button>
            </div>
          </aside>
        </section>
      </StudioShell>
    </>
  );
}
