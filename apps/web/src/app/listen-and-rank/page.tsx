import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CheckCircle2, Headphones, Trophy } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { ListenAndRankClient } from "@/components/ListenAndRankClient";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";

const rankTasks = [
  { title: "听两首候选歌", reward: "+2 额度", detail: "比较旋律、咬字、结构和可循环度。" },
  { title: "选择更好版本", reward: "+3 额度", detail: "帮助 Melo 判断哪一个生成结果更接近用户意图。" },
  { title: "标记问题片段", reward: "+5 额度", detail: "指出跑调、含混、节奏错误或歌词不自然的位置。" },
];

const leaderboard = [
  ["青禾", "1,280"],
  ["星海", "1,060"],
  ["阿燃", "940"],
  ["南汐", "880"],
];

export default function ListenAndRankPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell title="赚取额度" className="melo-rail-offset melo-mobile-dock-offset" showHeader={false}>
        <section className="grid min-h-[430px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-meter-green/35 bg-meter-green/10 px-3 py-1 text-xs text-meter-green">
              <BadgeDollarSign className="size-3.5" />
              Earn Credits
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              听歌、排序、反馈，然后赚取 Melo 创作额度
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              对齐目标站的 Earn Credits / Listen and Rank 入口。这里提供公开的听歌评审流程，并在无后端环境下记录本地奖励与模型偏好数据。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/discover">
                  开始听歌
                  <Headphones className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">
                  查看额度规则
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-panel-border bg-black/25 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Trophy className="size-4 text-studio-gold" />
              本周评审榜
            </div>
            {leaderboard.map(([name, score], index) => (
              <div key={name} className="flex items-center justify-between border-t border-panel-border py-3 first:border-t-0">
                <span className="flex items-center gap-3 text-sm">
                  <span className="w-6 font-mono text-xs text-muted-foreground">{index + 1}</span>
                  {name}
                </span>
                <span className="font-mono text-xs text-studio-gold">{score}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {rankTasks.map((task) => (
            <article key={task.title} className="studio-surface rounded-lg p-5">
              <div className="mb-4 flex items-center justify-between">
                <CheckCircle2 className="size-5 text-meter-green" />
                <span className="rounded-md bg-meter-green/10 px-2 py-1 font-mono text-xs text-meter-green">
                  {task.reward}
                </span>
              </div>
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.detail}</p>
            </article>
          ))}
        </section>

        <div className="mt-8">
          <ListenAndRankClient />
        </div>
      </StudioShell>
    </>
  );
}
