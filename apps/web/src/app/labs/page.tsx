import Link from "next/link";
import { ArrowRight, FlaskConical, Mic2, SlidersHorizontal, Sparkles, Waves } from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";

const experiments = [
  {
    title: "Melo v5.5 声线实验",
    status: "开放试用",
    description: "更自然的中文咬字、更稳定的人声延续和更清晰的副歌记忆点。",
    href: "/create?model=v5.5",
    icon: Mic2,
  },
  {
    title: "参考音频重构",
    status: "Pro",
    description: "上传片段后提取节奏、情绪和结构，生成新的中文音乐方向。",
    href: "/studio/pro",
    icon: Waves,
  },
  {
    title: "结构编辑建议",
    status: "Beta",
    description: "为生成结果推荐主歌、副歌、桥段和延展版本的下一步修改。",
    href: "/studio/editor",
    icon: SlidersHorizontal,
  },
];

export default function LabsPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell title="实验室" className="melo-rail-offset melo-mobile-dock-offset" showHeader={false}>
        <section className="grid min-h-[430px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-studio-gold/10 px-3 py-1 text-xs text-studio-gold">
              <FlaskConical className="size-3.5" />
              Labs
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              提前体验 Melo 的新模型、新声线和编辑实验
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              目标站公开导航包含 Labs。Melo 实验室把新模型、参考音频、结构编辑等探索能力集中到一个入口。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/create">
                  试用实验能力
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/studio/projects">查看项目版本</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-panel-border bg-black/25 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-studio-gold" />
              实验守则
            </div>
            {["实验功能可能快速变化", "建议保存满意版本", "公开发布前可继续编辑", "Pro 功能会消耗更多额度"].map((item) => (
              <div key={item} className="border-t border-panel-border py-3 text-sm text-muted-foreground first:border-t-0">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {experiments.map((experiment) => {
            const Icon = experiment.icon;
            return (
              <Link
                key={experiment.title}
                href={experiment.href}
                className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-panel-border bg-black/20 text-studio-gold">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-muted-foreground">
                    {experiment.status}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{experiment.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{experiment.description}</p>
              </Link>
            );
          })}
        </section>
      </StudioShell>
    </>
  );
}
