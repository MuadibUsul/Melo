"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, GitBranch, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { getLocalDemoPublishedTracks } from "@/lib/local-demo-generation";
import { TrackInteractiveSection } from "./TrackInteractiveSection";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LocalTrackDetail() {
  const pathname = usePathname();
  const trackId = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const track = useMemo(
    () => getLocalDemoPublishedTracks().find((item) => item.id === trackId) ?? null,
    [trackId],
  );

  if (!track) {
    return (
      <div className="studio-surface rounded-lg p-6 text-muted-foreground">
        <p className="text-sm">作品不存在，或尚未发布。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/library?view=created" className="text-sm text-studio-gold">
            返回已发布作品
          </Link>
          <Link href="/studio/drafts" className="text-sm text-studio-gold">
            查看草稿
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <div className="studio-surface aspect-square rounded-lg p-6">
          <div className="flex h-full flex-col items-center justify-center rounded-lg bg-studio-gold/10 text-center text-studio-gold">
            <div className="text-xs uppercase tracking-[0.18em] text-studio-gold/80">Local Track</div>
            <div className="mt-3 max-w-[12rem] text-2xl font-semibold">{track.title}</div>
            <div className="mt-3 text-xs text-studio-gold/80">{formatDate(track.createdAt)}</div>
          </div>
        </div>

        <section className="studio-surface rounded-lg p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{track.genre}</Badge>
            <Badge variant="outline">本地演示</Badge>
            <Badge variant="outline">{track.visibility === "public" ? "公开" : "仅链接可见"}</Badge>
            <Badge variant="outline">AI 生成</Badge>
          </div>
          <Link href="/library?view=created" className="text-sm text-studio-gold">
            我的创作
          </Link>
          <div className="mt-5">
            <TrackInteractiveSection
              id={track.id}
              title={track.title}
              artist="我的创作"
              audioUrl={track.audioUrl}
              durationMs={track.durationMs}
            />
          </div>
          <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div>播放 0</div>
            <div>收藏 0</div>
            <div>评论 本地</div>
          </div>
          <div className="mt-6 rounded-lg border border-panel-border bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
            这首作品来自无后端演示创作流，音频和发布记录保存在当前浏览器。你可以播放、下载、评论、Remix，
            或回到资料库继续整理。
          </div>
        </section>

        <aside className="space-y-5">
          <section className="studio-surface rounded-lg p-5">
            <div className="mb-4 text-lg font-semibold">收录位置</div>
            <Link
              href="/library?view=created"
              className="block rounded-lg border border-panel-border bg-black/20 px-3 py-3 transition hover:border-studio-gold/45"
            >
              <div className="text-sm font-medium">已发布作品</div>
              <div className="mt-1 text-xs text-muted-foreground">Melo 资料库</div>
            </Link>
          </section>

          <section className="studio-surface rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <GitBranch className="size-5 text-studio-gold" />
              创作谱系
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="rounded-lg border border-panel-border bg-black/20 p-3">
                本地演示生成，可继续翻唱、延展、Remix 或打开编辑器。
              </div>
              <Link
                href={`/studio/simple?prompt=${encodeURIComponent(`参考《${track.title}》创作一首新的中文歌曲`)}`}
                className="flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45 hover:text-foreground"
              >
                <Sparkles className="size-4 text-studio-gold" />
                参考这首歌创作
              </Link>
              <Link
                href={`/studio/editor?source=${encodeURIComponent(track.id)}`}
                className="flex items-center gap-2 rounded-lg border border-panel-border bg-black/20 p-3 transition hover:border-studio-gold/45 hover:text-foreground"
              >
                <AudioLines className="size-4 text-studio-gold" />
                进入歌曲编辑器
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
