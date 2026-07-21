import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileAudio,
  FileText,
  GripVertical,
  ListChecks,
  Music2,
  Repeat2,
  Scissors,
  Shuffle,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { MeloMobileDock } from "@/components/MeloMobileDock";
import { MeloMobileTopBar } from "@/components/MeloMobileTopBar";
import { MeloRail } from "@/components/MeloRail";
import { MeloTopBar } from "@/components/MeloTopBar";
import { StudioNav } from "@/components/StudioNav";
import { StudioShell } from "@/components/StudioShell";
import { Button } from "@/components/ui/button";

const sections = [
  { name: "Intro", time: "0:00 - 0:12", note: "保留氛围铺底" },
  { name: "主歌 A", time: "0:12 - 0:46", note: "歌词可以继续重写" },
  { name: "副歌", time: "0:46 - 1:18", note: "可延展为双副歌" },
  { name: "Bridge", time: "1:18 - 1:44", note: "建议加入转调" },
  { name: "Outro", time: "1:44 - 2:04", note: "淡出或循环结尾" },
];

const editActions = [
  { title: "重写歌词", description: "选择段落后生成新的中文表达，保留旋律和情绪。", icon: FileText, href: "/studio/pro" },
  { title: "延展歌曲", description: "从副歌、桥段或结尾继续生成更长版本。", icon: Repeat2, href: "/studio/pro?mode=extend" },
  { title: "Remix 版本", description: "保留主题，切换风格、节奏、速度或演唱人设。", icon: Shuffle, href: "/studio/simple" },
  { title: "裁剪片段", description: "整理开头、间奏和结尾，导出适合短视频的版本。", icon: Scissors, href: "/studio/drafts" },
];

const stems = [
  { name: "完整混音", detail: "Master WAV / MP3", icon: Music2 },
  { name: "人声", detail: "Lead vocal stem", icon: FileAudio },
  { name: "伴奏", detail: "Instrumental stem", icon: FileAudio },
  { name: "鼓组与低频", detail: "Drums / Bass stem", icon: FileAudio },
];

const checks = ["标题与封面", "歌词与版权声明", "公开范围", "下载格式", "发布到曲库"];

export default function StudioEditorPage() {
  return (
    <>
      <MeloMobileTopBar />
      <MeloRail />
      <MeloTopBar />
      <MeloMobileDock />
      <StudioShell
        className="melo-rail-offset melo-mobile-dock-offset"
        eyebrow="编辑"
        title="歌曲编辑器"
        description="把生成后的草稿继续重写、重排、延展、Remix，并准备分轨下载和发布。"
      >
        <StudioNav />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Timeline</div>
                <h2 className="mt-1 text-xl font-semibold">城市微光 · 编辑草稿</h2>
              </div>
              <Button asChild>
                <Link href="/studio/drafts">
                  打开草稿箱
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="mb-5 h-28 rounded-lg border border-panel-border bg-[linear-gradient(90deg,rgba(233,200,111,0.18),rgba(39,224,167,0.13),rgba(255,255,255,0.04))] p-4">
              <div className="flex h-full items-end gap-1">
                {Array.from({ length: 56 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-studio-gold/70"
                    style={{ height: `${28 + ((index * 17) % 58)}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.name}
                  className="grid gap-3 rounded-lg border border-panel-border bg-black/20 p-3 sm:grid-cols-[28px_120px_minmax(0,1fr)_auto]"
                >
                  <GripVertical className="mt-1 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{section.name}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{section.time}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{section.note}</div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/studio/pro">编辑</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="studio-surface rounded-lg p-5">
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <WandSparkles className="size-5 text-studio-gold" />
                智能编辑
              </div>
              <div className="space-y-2">
                {editActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="block rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-studio-gold">
                          <Icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{action.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{action.description}</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="studio-surface rounded-lg p-5">
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Download className="size-5 text-meter-green" />
                分轨导出
              </div>
              <div className="space-y-2">
                {stems.map((stem) => {
                  const Icon = stem.icon;
                  return (
                    <div key={stem.name} className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-studio-gold" />
                        <div>
                          <div className="text-sm font-medium">{stem.name}</div>
                          <div className="text-xs text-muted-foreground">{stem.detail}</div>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/studio/drafts">导出</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="studio-surface rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-studio-gold" />
              版本建议
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["广播版", "短视频版", "纯伴奏版"].map((version) => (
                <Link
                  key={version}
                  href="/studio/pro"
                  className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm transition hover:border-studio-gold/45"
                >
                  {version}
                  <span className="mt-2 block text-xs leading-5 text-muted-foreground">复制当前草稿并生成新的版本。</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="studio-surface rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <ListChecks className="size-5 text-meter-green" />
              发布前检查
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {checks.map((check) => (
                <div key={check} className="rounded-lg border border-panel-border bg-black/20 px-3 py-2 text-sm">
                  {check}
                </div>
              ))}
            </div>
          </div>
        </section>
      </StudioShell>
    </>
  );
}
