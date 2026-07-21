import Link from "next/link";
import { ArrowRight, Headphones, PlayCircle, Sparkles, Webhook } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";

const hooks = [
  {
    title: "一句副歌就记住",
    mood: "中文流行 / 明亮",
    prompt: "强记忆点中文副歌，女声，旋律上扬，适合短视频循环",
    plays: "24.8k",
  },
  {
    title: "国风入场",
    mood: "国风 / 史诗",
    prompt: "国风电子 hook，竹笛、鼓组、女声吟唱，适合角色登场",
    plays: "19.2k",
  },
  {
    title: "深夜 R&B",
    mood: "R&B / 松弛",
    prompt: "低频 R&B hook，中文呢喃，夜晚城市感，副歌轻柔重复",
    plays: "17.6k",
  },
  {
    title: "一分钟爆点",
    mood: "电子 / 高能",
    prompt: "60 秒电子流行 hook，鼓点直接，适合剪辑高潮",
    plays: "15.9k",
  },
];

export default function HooksPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell title="Hooks" className="melo-rail-offset melo-mobile-dock-offset" showHeader={false}>
        <section className="grid min-h-[430px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-studio-gold/10 px-3 py-1 text-xs text-studio-gold">
              <Webhook className="size-3.5" />
              Hooks
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              先抓住一句好听的 Hook，再生成完整歌曲
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              目标页公开导航包含 Hooks。Melo 把它做成中文灵感入口：浏览短副歌、复制提示词、直接进入创作或 Remix。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/create">
                  用 Hook 创作
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/discover">返回发现</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-panel-border bg-black/25 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-studio-gold" />
              今日 Hook 流程
            </div>
            {["选一个短动机", "带入风格和声线", "生成完整歌曲", "继续延展或 Remix"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 border-t border-panel-border py-3 first:border-t-0">
                <span className="flex size-7 items-center justify-center rounded-md bg-studio-gold/10 font-mono text-xs text-studio-gold">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {hooks.map((hook) => (
            <article key={hook.title} className="studio-surface rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                {hook.mood}
                <span className="inline-flex items-center gap-1">
                  <Headphones className="size-3.5" />
                  {hook.plays}
                </span>
              </div>
              <h2 className="text-lg font-semibold">{hook.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-5 text-muted-foreground">{hook.prompt}</p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/studio/simple?prompt=${encodeURIComponent(hook.prompt)}`}>
                    <PlayCircle className="size-4" />
                    生成
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/studio/pro?mode=remix&prompt=${encodeURIComponent(hook.prompt)}`}>Remix</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      </StudioShell>
    </>
  );
}
