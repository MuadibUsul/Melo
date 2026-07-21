import Link from "next/link";
import {
  AudioLines,
  FileClock,
  FileText,
  FolderKanban,
  Mic2,
  Music2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { QuickCreateComposer } from "@/components/QuickCreateComposer";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";

const creationModes = [
  {
    href: "/studio/simple",
    title: "快速创作",
    description: "用一句提示词生成完整歌曲，适合马上记录灵感和测试方向。",
    icon: WandSparkles,
  },
  {
    href: "/studio/pro",
    title: "高级创作",
    description: "控制歌词结构、参考音频、声音细节和高级参数，制作更完整的作品。",
    icon: SlidersHorizontal,
  },
  {
    href: "/studio/drafts",
    title: "草稿管理",
    description: "查看生成历史、试听草稿，把满意的版本发布到音乐库。",
    icon: FileClock,
  },
];

const creationTools = [
  {
    href: "/studio/pro",
    title: "上传参考音频",
    description: "用已有片段、旋律或节奏作为创作参考。",
    icon: Upload,
  },
  {
    href: "/studio/pro",
    title: "哼唱生成",
    description: "把口述旋律、哼唱或节奏想法带进高级模式。",
    icon: Mic2,
  },
  {
    href: "/studio/pro",
    title: "自定义歌词",
    description: "编写主歌、副歌、桥段和结尾，让结构更可控。",
    icon: FileText,
  },
  {
    href: "/studio/voices",
    title: "声音与人设",
    description: "选择声音气质，预览后带入歌曲生成。",
    icon: AudioLines,
  },
  {
    href: "/studio/presets",
    title: "风格预设",
    description: "从中文流行、国风、电子、Lo-fi 等风格快速开始。",
    icon: Music2,
  },
  {
    href: "/studio/editor",
    title: "歌曲编辑器",
    description: "重写段落、重排结构、延展版本，并准备分轨下载。",
    icon: SlidersHorizontal,
  },
  {
    href: "/studio/projects",
    title: "项目与版本",
    description: "继续编辑旧草稿，比较版本并整理创作资产。",
    icon: FolderKanban,
  },
];

const workflow = ["描述歌曲想法", "选择风格与声音", "生成并试听草稿", "继续编辑或发布"];

export default function CreatePage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell title="创作" className="melo-rail-offset melo-mobile-dock-offset" showHeader={false}>
        <section className="grid min-h-[560px] items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-studio-gold/10 px-3 py-1 text-xs text-studio-gold lg:mx-0">
              <Sparkles className="size-3.5" />
              Melo Create
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:mx-0">
              把脑海里的歌，变成可以播放、编辑和发布的作品
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground lg:mx-0">
              直接描述歌曲，也可以上传参考音频、哼唱旋律、编写歌词、选择声音人设，再进入高级模式精修。
            </p>
            <QuickCreateComposer className="mx-auto w-full max-w-3xl text-left lg:mx-0" />
          </div>

          <div className="rounded-lg border border-panel-border bg-black/25 p-4">
            <div className="mb-4 text-sm font-semibold">创作流程</div>
            <div className="space-y-3">
              {workflow.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-panel-border bg-black/20 p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-studio-gold/10 font-mono text-xs text-studio-gold">
                    {index + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-4 w-full" size="lg">
              <Link href="/studio/pro">
                打开高级创作
                <SlidersHorizontal className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">选择创作模式</h2>
            <Link href="/studio" className="text-sm text-studio-gold">
              进入工作台
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {creationModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  key={mode.href}
                  href={mode.href}
                  className="studio-surface rounded-lg p-5 text-left transition hover:border-studio-gold/45"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-panel-border bg-black/20 text-studio-gold">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{mode.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">创作工具</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              补齐上传、参考、声音、歌词和版本路径，让从灵感到发布的每一步都有明确入口。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {creationTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-studio-gold">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block font-medium">{tool.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-muted-foreground">{tool.description}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </StudioShell>
    </>
  );
}
