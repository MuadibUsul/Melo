"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, FileText, LogIn, Mail, Mic2, Music2, Phone, Plus, Shuffle, Upload, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "一首关于夏夜来信的中文流行歌，女声，温暖又有一点遗憾",
  "国风电子，竹笛和低频鼓组，适合游戏角色登场",
  "Lo-fi 纯音乐，适合深夜写作，柔和钢琴和雨声",
  "明亮的独立流行，男声，副歌适合合唱，主题是重新出发",
  "赛博朋克电子舞曲，强鼓点，适合短视频开场",
];

const styles = ["中文流行", "国风", "R&B", "电子", "Lo-fi"] as const;
const voices = ["女声", "男声", "合唱", "无人声"] as const;

const quickTools = [
  { kind: "upload", label: "上传音频", icon: Upload, proTab: "reference", referenceAudioType: "style" },
  { kind: "humming", label: "哼唱旋律", icon: Mic2, proTab: "reference", referenceAudioType: "melody" },
  { kind: "lyrics", label: "自定义歌词", icon: FileText, proTab: "structure" },
] as const;

export function QuickCreateComposer({ className }: { className?: string }) {
  const router = useRouter();
  const auth = useAuth();
  const [prompt, setPrompt] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [mode, setMode] = useState<"song" | "instrumental">("song");
  const [style, setStyle] = useState<(typeof styles)[number]>("中文流行");
  const [voice, setVoice] = useState<(typeof voices)[number]>("女声");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const canSubmit = prompt.trim().length > 0;
  const createUrl = buildCreateUrl(prompt.trim());

  function buildCreateUrl(nextPrompt: string) {
    const params = new URLSearchParams();
    if (nextPrompt) params.set("prompt", nextPrompt);
    params.set("genre", style);
    params.set("vocal", mode === "instrumental" ? "无人声" : voice);
    if (mode === "instrumental") params.set("lyricsMode", "instrumental");
    return `/studio/simple?${params.toString()}`;
  }

  function buildProUrl(tool: (typeof quickTools)[number]) {
    const nextPrompt = prompt.trim();
    const params = new URLSearchParams();
    params.set("tool", tool.kind);
    params.set("proTab", tool.proTab);
    params.set("genre", style);
    params.set("vocal", mode === "instrumental" ? "无人声" : voice);
    if ("referenceAudioType" in tool) params.set("referenceAudioType", tool.referenceAudioType);
    if (nextPrompt) {
      params.set("prompt", nextPrompt);
      if (tool.kind === "lyrics") params.set("lyricsPrompt", nextPrompt);
    }
    return `/studio/pro?${params.toString()}`;
  }

  function submit() {
    if (!canSubmit) return;
    if (!auth.user) {
      setAuthOpen(true);
      return;
    }
    router.push(createUrl);
  }

  function inspire() {
    const nextIndex = (exampleIndex + 1) % EXAMPLES.length;
    const nextPrompt = EXAMPLES[nextIndex]!;
    setExampleIndex(nextIndex);
    setPrompt(nextPrompt);
    if (nextPrompt.includes("纯音乐")) {
      setMode("instrumental");
      setVoice("无人声");
    }
    if (nextPrompt.includes("国风")) setStyle("国风");
    if (nextPrompt.includes("Lo-fi")) setStyle("Lo-fi");
    if (nextPrompt.includes("电子")) setStyle("电子");
  }

  function selectMode(nextMode: "song" | "instrumental") {
    setMode(nextMode);
    if (nextMode === "instrumental") {
      setVoice("无人声");
    } else if (voice === "无人声") {
      setVoice("女声");
    }
  }

  return (
    <div className={cn("relative mt-6 rounded-lg border border-panel-border bg-black/35 p-3 shadow-2xl shadow-black/20", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-studio-gold">
          <WandSparkles className="size-3.5" />
          描述你想做的歌
        </div>
        <div className="flex rounded-lg border border-panel-border bg-black/20 p-1">
          {[
            { key: "song", label: "歌曲", icon: Music2 },
            { key: "instrumental", label: "纯音乐", icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => selectMode(item.key as "song" | "instrumental")}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs transition",
                  active ? "bg-studio-gold/15 text-studio-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-panel-border bg-black/30 p-3">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={mode === "instrumental" ? "描述你想做的纯音乐" : "描述你想做的歌曲"}
          className="min-h-24 resize-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
          onKeyDown={(event) => {
            if (canSubmit && (event.metaKey || event.ctrlKey) && event.key === "Enter") {
              submit();
            }
          }}
        />

        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={toolsOpen ? "secondary" : "outline"}
              size="icon-lg"
              title="添加创作素材"
              aria-label="添加创作素材"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((open) => !open)}
            >
              <Plus className={cn("size-4 transition", toolsOpen && "rotate-45")} />
            </Button>
            <Button variant="outline" size="icon-lg" title="换一个灵感" onClick={inspire}>
              <Shuffle className="size-4" />
            </Button>
            <div className="text-xs text-muted-foreground">{canSubmit ? "Ctrl / ⌘ + Enter 创建" : "输入提示词后即可创建"}</div>
          </div>

          <Button className="h-10 px-5" onClick={submit} disabled={!canSubmit}>
            创作
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {toolsOpen ? (
          <div className="mt-3 grid gap-2 rounded-lg border border-panel-border bg-black/25 p-2 sm:grid-cols-3">
            {quickTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.label}
                  href={buildProUrl(tool)}
                  className="flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 px-3 py-2 text-sm text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
                >
                  <Icon className="size-4 text-studio-gold" />
                  {tool.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-wrap gap-2">
          {styles.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStyle(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                style === item
                  ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                  : "border-panel-border bg-black/20 text-muted-foreground hover:border-studio-gold/45 hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          {voices.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setVoice(item);
                setMode(item === "无人声" ? "instrumental" : "song");
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                voice === item
                  ? "border-meter-green/45 bg-meter-green/10 text-meter-green"
                  : "border-panel-border bg-black/20 text-muted-foreground hover:border-meter-green/45 hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.slice(0, 3).map((example, index) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setExampleIndex(index);
              setPrompt(example);
            }}
            className="rounded-full border border-panel-border bg-black/20 px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </div>

      {authOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => event.target === event.currentTarget && setAuthOpen(false)}
        >
          <div className="studio-surface w-full max-w-md rounded-lg p-5 text-left shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-studio-gold/30 bg-studio-gold/10 px-3 py-1 text-xs text-studio-gold">
                  <LogIn className="size-3.5" />
                  Melo 账号
                </div>
                <h2 className="text-2xl font-semibold">欢迎回到 Melo</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  登录后再创建，Melo 会保存你的提示词、生成草稿、额度和发布记录。
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setAuthOpen(false)} aria-label="关闭登录面板">
                <X className="size-4" />
              </Button>
            </div>

            <div className="rounded-lg border border-panel-border bg-black/25 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">当前提示词</div>
              <p className="mt-2 line-clamp-3 text-sm leading-6">{prompt.trim()}</p>
            </div>

            <div className="mt-4 grid gap-2">
              <Button asChild className="h-10 w-full">
                <Link href={`/login?next=${encodeURIComponent(createUrl)}`}>
                  <Mail className="size-4" />
                  使用邮箱登录
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 w-full">
                <Link href={`/signin?next=${encodeURIComponent(createUrl)}`}>
                  <Phone className="size-4" />
                  继续登录 / 注册
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-10 w-full">
                <Link href={createUrl}>先进入演示创作台</Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              与目标站一致，未登录创建会先要求登录；演示入口仅用于本地验证完整创作流程。
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
