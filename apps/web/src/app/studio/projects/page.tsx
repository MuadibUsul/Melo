import Link from "next/link";
import { Clock3, GitBranch, Layers, ListChecks, PlayCircle, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";

const projects = [
  {
    title: "夏夜来信",
    status: "编辑中",
    style: "中文流行 / 女声",
    versions: ["v1 提示词草稿", "v2 副歌增强", "v3 待发布"],
    updated: "今天 19:20",
  },
  {
    title: "星门战斗主题",
    status: "待混音",
    style: "游戏配乐 / 纯音乐",
    versions: ["v1 战斗循环", "v2 管弦层次", "v3 短视频版"],
    updated: "昨天 22:05",
  },
  {
    title: "自习室雨声延展",
    status: "已整理",
    style: "Lo-fi / 无人声",
    versions: ["v1 30 秒片段", "v2 完整版"],
    updated: "06-28 11:40",
  },
];

const workflow = [
  { icon: Sparkles, title: "生成草稿", text: "从发现页、创作页或预设进入工作台生成第一个版本。" },
  { icon: GitBranch, title: "比较版本", text: "保留每次重生成、延展和编辑记录，挑出最满意的方向。" },
  { icon: ListChecks, title: "发布准备", text: "补齐标题、风格、可见性和授权说明，再发布到音乐库。" },
];

export default function StudioProjectsPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell className="melo-rail-offset melo-mobile-dock-offset" eyebrow="项目" title="项目与版本" description="整理生成历史、比较版本、继续编辑旧草稿，并准备发布资产。">
        <StudioNav />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {projects.map((project) => (
              <article key={project.title} className="studio-surface rounded-lg p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">{project.title}</h2>
                      <span className="rounded border border-studio-gold/35 bg-studio-gold/10 px-2 py-0.5 text-xs text-studio-gold">
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{project.style}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      {project.updated}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href="/studio/editor">
                        <Layers className="size-3.5" />
                        继续编辑
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/studio/drafts">
                        <PlayCircle className="size-3.5" />
                        查看草稿
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {project.versions.map((version) => (
                    <div key={version} className="rounded-lg border border-panel-border bg-black/20 p-3 text-sm">
                      <div className="font-medium">{version}</div>
                      <div className="mt-1 text-xs text-muted-foreground">可比较、复制或继续延展</div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="studio-surface rounded-lg p-5">
              <Button asChild className="w-full">
                <Link href="/create">
                  <Plus className="size-4" />
                  新建项目
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link href="/studio/drafts">打开草稿管理</Link>
              </Button>
            </div>
            <div className="studio-surface rounded-lg p-5">
              <div className="text-lg font-semibold">项目流程</div>
              <div className="mt-4 space-y-3">
                {workflow.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-lg border border-panel-border bg-black/20 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="size-4 text-studio-gold" />
                        {item.title}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </StudioShell>
    </>
  );
}
