"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Columns, Cpu, GitBranch, Layers, Loader2, Music2, Radio, Send, Sparkles, Wand2, X } from "lucide-react";
import { useCreateJob, useCancelJob, useJob, useJobRealtime } from "@/lib/api/hooks/use-generation";
import { useAuth } from "@/lib/auth/auth-context";
import { isNetworkError } from "@/lib/fallback/catalog";
import { saveLocalDemoDraft, spendLocalDemoCredits } from "@/lib/local-demo-generation";
import type { GenerateRequest } from "@/types/music";
import type { JobView } from "@music/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { DEFAULT_PRO_PARAMS, ProModePanel, type ProModeParams, type ProModeTab } from "./ProModePanel";
import { DEFAULT_TTS, TtsProPanel, type TtsProParams } from "./TtsProPanel";
import { MusicParameterPanel } from "./MusicParameterPanel";
import { SafetyNotice } from "./SafetyNotice";
import { VisualMeter } from "./VisualMeter";

interface VersionEntry {
  jobId: string;
  label: string;
  status: string;
  createdAt: string;
}

function getLocalCreditCost(type: string, mode: string) {
  if (type === "tts") return 2;
  return mode === "pro" ? 15 : 10;
}

export function StudioClientV3({
  initial,
  initialMode = "simple",
  initialPro,
  initialProTab,
}: {
  initial?: Partial<GenerateRequest>;
  initialMode?: "simple" | "pro" | "tts";
  initialPro?: Partial<ProModeParams>;
  initialProTab?: ProModeTab;
}) {
  const auth = useAuth();
  const [mode, setMode] = useState<"simple" | "pro" | "tts">(initialMode);
  const [form, setForm] = useState<GenerateRequest>({
    prompt:
      initial?.prompt ??
      "\u5199\u4e00\u9996\u4e2d\u6587\u6d41\u884c\u6b4c\u66f2\uff0c\u5973\u58f0\uff0c\u5e26\u4e00\u70b9\u57ce\u5e02\u591c\u8272\u611f\u3002",
    genre: initial?.genre ?? "\u4e2d\u6587\u6d41\u884c",
    mood: initial?.mood ?? "\u6cbb\u6108",
    vocal: initial?.vocal ?? "\u5973\u58f0",
    lyricsMode: initial?.lyricsMode ?? "ai",
    durationPreset: initial?.durationPreset ?? "60 \u79d2\u8bd5\u542c\u7248",
    outputFormat: "mp3",
  });
  const [proParams, setProParams] = useState<ProModeParams>(() => ({
    ...DEFAULT_PRO_PARAMS,
    ...initialPro,
    lyricsStructure: initialPro?.lyricsStructure ?? DEFAULT_PRO_PARAMS.lyricsStructure,
    advancedSettings: {
      ...DEFAULT_PRO_PARAMS.advancedSettings,
      ...initialPro?.advancedSettings,
    },
  }));
  const [ttsParams, setTtsParams] = useState<TtsProParams>(DEFAULT_TTS);
  const [error, setError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [parentJobId, setParentJobId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [localJob, setLocalJob] = useState<JobView | null>(null);

  const HARD_TIMEOUT_MS = 420_000; // 7 minutes
  const generationStartRef = useRef<number | null>(null);
  const hardTimeoutFiredRef = useRef(false);
  const cancelJob = useCancelJob();
  const cancelJobMutateRef = useRef(cancelJob.mutate);

  const createJob = useCreateJob();
  const shouldFetchJob = activeJobId && !activeJobId.startsWith("demo-job") ? activeJobId : undefined;
  const { data: job } = useJob(shouldFetchJob);
  const { data: jobA } = useJob(compareA ?? undefined);
  const { data: jobB } = useJob(compareB ?? undefined);
  const currentJob = localJob?.id === activeJobId ? localJob : job;

  useEffect(() => {
    cancelJobMutateRef.current = cancelJob.mutate;
  }, [cancelJob.mutate]);

  useJobRealtime(
    auth.user?.id,
    useCallback((event) => {
      if (event.status === "succeeded") {
        toast("\u751f\u6210\u5b8c\u6210", "success");
        window.dispatchEvent(new Event("drafts-updated"));
        window.dispatchEvent(new Event("credits-updated"));
      }
      setVersions((prev) =>
        prev.map((item) => (item.jobId === event.jobId ? { ...item, status: event.status } : item)),
      );
    }, []),
  );

  async function generateLyrics() {
    setError(null);
    setLyricsLoading(true);
    try {
      const response = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.prompt,
          genre: form.genre,
          mood: form.mood,
          vocal: form.vocal,
          durationPreset: form.durationPreset,
        }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      setForm((current) => ({ ...current, lyricsMode: "custom", lyrics: json.data.lyrics }));
      toast("\u6b4c\u8bcd\u5df2\u751f\u6210", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u6b4c\u8bcd\u751f\u6210\u5931\u8d25");
    } finally {
      setLyricsLoading(false);
    }
  }

  function buildGenerationPayload() {
    if (mode === "tts") {
      return { type: "tts", mode: "simple" as const, params: { ...ttsParams } };
    }
    if (mode === "pro") {
      return {
        type: "music",
        mode: "pro" as const,
        params: {
          lyricsStructure: proParams.lyricsStructure,
          referenceAudioUrl: proParams.referenceAudioUrl,
          referenceAudioType: proParams.referenceAudioType,
          advancedSettings: proParams.advancedSettings,
          isInstrumental: proParams.lyricsStructure.every((section) => !section.text.trim()),
        },
      };
    }
    return {
      type: "music",
      mode: "simple" as const,
      params: {
        prompt: form.prompt,
        lyrics: form.lyricsMode === "instrumental" ? undefined : form.lyrics,
        isInstrumental: form.lyricsMode === "instrumental",
        audioSetting: { format: form.outputFormat ?? "mp3" },
      },
    };
  }

  async function generateMusic() {
    setError(null);
    const payload = buildGenerationPayload();
    const submitLocalDemo = async (reason?: string) => {
      const createdAt = new Date().toISOString();
      const creditCost = getLocalCreditCost(payload.type, payload.mode);
      const creditSpend = spendLocalDemoCredits(creditCost);
      if (creditSpend.error) {
        setError(creditSpend.error);
        toast(creditSpend.error, "error");
        return;
      }
      const processingJob: JobView = {
        id: `demo-job-${Date.now()}`,
        type: payload.type === "tts" ? "tts" : "music",
        mode: payload.mode === "pro" ? "pro" : "simple",
        status: "processing",
        creditCost: creditSpend.spent ? creditCost : 0,
        assetId: null,
        createdAt,
        completedAt: null,
      };
      setLocalJob(processingJob);
      setActiveJobId(processingJob.id);
      setVersions((prev) => [
        ...prev,
        {
          jobId: processingJob.id,
          label: `v${prev.length + 1}`,
          status: processingJob.status,
          createdAt,
        },
      ]);
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      const prompt =
        mode === "tts"
          ? ttsParams.text
          : mode === "pro"
            ? proParams.lyricsStructure.map((section) => section.text).filter(Boolean).join(" ") || form.prompt
            : form.prompt;
      const { job: demoJob } = saveLocalDemoDraft({
        prompt,
        genre: form.genre,
        type: payload.type,
        mode: payload.mode,
        creditCost: creditSpend.spent ? creditCost : 0,
      });
      const finishedJob = { ...demoJob, id: processingJob.id };
      setLocalJob(finishedJob);
      setVersions((prev) =>
        prev.map((item) => (item.jobId === processingJob.id ? { ...item, status: finishedJob.status } : item)),
      );
      if (!parentJobId) setParentJobId(processingJob.id);
      window.dispatchEvent(new Event("drafts-updated"));
      window.dispatchEvent(new Event("credits-updated"));
      toast(reason ?? "本地演示草稿已生成", "success");
    };

    if (!auth.user) {
      await submitLocalDemo("已用本地演示模式生成草稿");
      return;
    }

    createJob.mutate(
      { ...payload, parentJobId: parentJobId ?? undefined },
      {
        onSuccess: (result) => {
          setActiveJobId(result.id);
          setVersions((prev) => [
            ...prev,
            {
              jobId: result.id,
              label: `v${prev.length + 1}`,
              status: result.status,
              createdAt: new Date().toISOString(),
            },
          ]);
          if (!parentJobId) setParentJobId(result.id);
          toast(
            result.isDuplicate
              ? "\u4efb\u52a1\u5df2\u5b58\u5728"
              : `\u4efb\u52a1\u5df2\u63d0\u4ea4 \u00b7 ${result.creditCost} \u989d\u5ea6`,
            "info",
          );
        },
        onError: (err) => {
          if (isNetworkError(err)) {
            void submitLocalDemo("后端暂不可用，已保存为本地演示草稿");
            return;
          }
          setError(err instanceof Error ? err.message : "\u751f\u6210\u5931\u8d25");
        },
      },
    );
  }

  async function reGenerate() {
    if (!activeJobId) return;
    setParentJobId(activeJobId);
    await generateMusic();
  }

  const isGenerating =
    createJob.isPending || currentJob?.status === "queued" || currentJob?.status === "processing";
  const isDone = currentJob?.status === "succeeded";
  const isFailed = currentJob?.status === "failed";

  useEffect(() => {
    if (isGenerating) {
      if (!generationStartRef.current) generationStartRef.current = Date.now();
    } else {
      generationStartRef.current = null;
      hardTimeoutFiredRef.current = false;
    }
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating || !activeJobId || activeJobId.startsWith("demo-job")) return;
    const timer = window.setTimeout(() => {
      if (hardTimeoutFiredRef.current) return;
      hardTimeoutFiredRef.current = true;
      cancelJobMutateRef.current(activeJobId, {
        onSuccess: () => {
          setActiveJobId(null);
          setLocalJob(null);
          toast("生成超时（7分钟），已自动取消。请重试。", "error");
        },
        onError: () => {
          toast("生成超时，请手动取消后重试。", "error");
        },
      });
    }, HARD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isGenerating, activeJobId, HARD_TIMEOUT_MS]);

  return (
    <div className="space-y-5">
      <div className="studio-surface flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">{"\u7b80\u6613\u6a21\u5f0f"}</SelectItem>
              <SelectItem value="pro">{"\u4e13\u4e1a\u6a21\u5f0f"}</SelectItem>
              <SelectItem value="tts">{"TTS \u8bed\u97f3"}</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-studio-gold/45 text-studio-gold">
            {"\u521b\u4f5c\u5f15\u64ce"}
          </Badge>
          {currentJob ? (
            <Badge variant={isGenerating ? "secondary" : isDone ? "default" : "destructive"}>
              {isGenerating
                ? "\u751f\u6210\u4e2d"
                : isDone
                  ? "\u5df2\u5b8c\u6210"
                  : isFailed
                    ? "\u5931\u8d25"
                    : currentJob.status}
            </Badge>
          ) : null}
        </div>

        {versions.length > 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="size-3.5" />
            {versions.map((version) => (
              <button
                key={version.jobId}
                className={`rounded px-2 py-0.5 font-mono ${
                  version.jobId === activeJobId
                    ? "bg-studio-gold/20 text-studio-gold"
                    : "hover:bg-studio-gold/10"
                }`}
                onClick={() => setActiveJobId(version.jobId)}
              >
                {version.label}
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setCompareA(versions[0]?.jobId ?? null);
                setCompareB(versions[versions.length - 1]?.jobId ?? null);
              }}
              title="A/B \u5bf9\u6bd4"
            >
              <Columns className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.88fr)_minmax(520px,1.12fr)]">
        <section className="studio-surface order-2 rounded-lg p-5 xl:order-1">
          <div className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <Cpu className="size-5 text-studio-gold" />
            {"\u53c2\u6570"}
          </div>

          {mode === "simple" ? <MusicParameterPanel value={form} onChange={setForm} /> : null}
          {mode === "pro" ? <ProModePanel value={proParams} onChange={setProParams} initialTab={initialProTab} /> : null}
          {mode === "tts" ? <TtsProPanel value={ttsParams} onChange={setTtsParams} /> : null}

          <div className="mt-5 space-y-4">
            <SafetyNotice />
            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <Button className="h-11" onClick={generateMusic} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {"\u751f\u6210\u4e2d"}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {auth.user ? "\u751f\u6210\u97f3\u4e50" : "本地演示生成"}
                  </>
                )}
              </Button>
              {isGenerating && activeJobId && !activeJobId.startsWith("demo-job") ? (
                <Button
                  variant="destructive"
                  className="h-11"
                  onClick={() =>
                    cancelJobMutateRef.current(activeJobId, {
                      onSuccess: () => {
                        setActiveJobId(null);
                        setLocalJob(null);
                      },
                    })
                  }
                >
                  <X className="size-4" />
                  取消
                </Button>
              ) : null}
              {activeJobId && isDone ? (
                <Button variant="secondary" className="h-11" onClick={reGenerate}>
                  <Layers className="size-4" />
                  {"\u91cd\u65b0\u751f\u6210"}
                </Button>
              ) : null}
              {mode === "simple" ? (
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={generateLyrics}
                  disabled={isGenerating || lyricsLoading || form.lyricsMode === "instrumental"}
                >
                  {lyricsLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {"\u5199\u8bcd\u4e2d"}
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      {"AI \u5199\u8bcd"}
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="studio-surface order-1 rounded-lg p-5 xl:order-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">输出预览</div>
              <div className="mt-1 text-xs text-muted-foreground">生成完成后，草稿会自动进入草稿管理，可试听、继续编辑或发布。</div>
            </div>
            <VisualMeter compact active={Boolean(isGenerating)} />
          </div>

          {compareA && compareB ? (
            <div className="mb-4 rounded-lg border border-studio-gold/30 bg-studio-gold/5 p-3">
              <p className="mb-2 text-xs font-semibold text-studio-gold">A/B 对比</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded bg-black/30 p-2">
                  <span className="text-muted-foreground">A:</span> {jobA?.status ?? "-"}
                </div>
                <div className="rounded bg-black/30 p-2">
                  <span className="text-muted-foreground">B:</span> {jobB?.status ?? "-"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setCompareA(null);
                  setCompareB(null);
                }}
              >
                关闭
              </Button>
            </div>
          ) : null}

          {isGenerating ? (
            <div className="rounded-lg border border-dashed border-panel-border bg-black/20 p-8 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-studio-gold" />
              <p className="mt-4 text-sm font-medium">生成中</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Melo 正在分析提示词、编排段落、生成音频并写入草稿。</p>
            </div>
          ) : isDone ? (
            <div className="rounded-lg border border-panel-border bg-black/20 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-studio-gold">
                <CheckCircle2 className="size-4" />
                生成完成
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                新版本已保存到草稿。你可以试听、继续扩写、进入编辑器微调结构，或发布到 Melo。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/studio/drafts">
                    <Music2 className="size-3.5" />
                    查看草稿
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/studio/editor">
                    <Layers className="size-3.5" />
                    继续编辑
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/library?view=created">
                    <Send className="size-3.5" />
                    发布准备
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-panel-border bg-black/20 p-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Radio className="size-4 text-studio-gold" />
                  等待生成
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "1", title: "提交提示词", text: "描述风格、情绪、人声和歌词方向。" },
                    { label: "2", title: "生成草稿", text: "任务进入队列，完成后保存为可发布草稿。" },
                    { label: "3", title: "编辑发布", text: "试听、重生成、延展或发布到音乐库。" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-panel-border bg-black/20 p-3">
                      <div className="font-mono text-xs text-studio-gold">{item.label}</div>
                      <div className="mt-2 text-sm font-medium">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
              {!auth.user ? (
                <div className="rounded-lg border border-studio-gold/35 bg-studio-gold/10 p-5 text-sm">
                  <div className="font-medium text-studio-gold">可先用本地演示生成</div>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    当前可以配置提示词和参数并保存到本地草稿。登录后，Melo 会优先把生成任务、草稿、额度和发布记录保存到你的账号。
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/login">登录 / 注册</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
