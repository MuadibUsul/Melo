"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Play, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { usePlayerStore } from "@/lib/player/use-player-store";

interface AssetDraft {
  id: string;
  storageKey: string;
  durationMs?: number | null;
  createdAt: string;
}

const GENRES = ["中文流行", "国风", "R&B", "电子", "Lo-fi", "纯音乐", "影视配乐", "游戏配乐", "说唱", "民谣"];

function formatDuration(ms?: number | null) {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function DraftList() {
  const [drafts, setDrafts] = useState<AssetDraft[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState({ title: "", genre: "中文流行", visibility: "public" });
  const titleRef = useRef<HTMLInputElement>(null);
  const player = usePlayerStore();

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.get<{ items: AssetDraft[] }>("/assets");
      setDrafts(data.items);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = window.setTimeout(refresh, 0);
    window.addEventListener("drafts-updated", refresh);
    return () => { window.clearTimeout(t); window.removeEventListener("drafts-updated", refresh); };
  }, []);

  function openPublish(id: string) {
    setForm({ title: "", genre: "中文流行", visibility: "public" });
    setDialog({ id });
    setTimeout(() => titleRef.current?.focus(), 50);
  }

  async function confirmPublish() {
    if (!dialog) return;
    const title = form.title.trim();
    if (!title) { titleRef.current?.focus(); return; }
    setPublishing(dialog.id);
    try {
      await api.post<{ trackId: string }>("/tracks/publish", {
        assetId: dialog.id,
        title,
        description: "",
        genre: form.genre,
        tags: ["AI 生成"],
        language: "zh",
        visibility: form.visibility,
      });
      setPublishedIds((prev) => new Set([...prev, dialog.id]));
      setDialog(null);
      await refresh();
      window.dispatchEvent(new Event("tracks-updated"));
      toast("作品已发布到曲库", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "发布失败，请稍后重试", "error");
    } finally {
      setPublishing(null);
    }
  }

  async function previewDraft(draft: AssetDraft) {
    try {
      const { url } = await api.get<{ url: string }>(`/assets/${draft.id}/play`);
      player.play({ id: draft.id, title: `草稿 · ${formatDate(draft.createdAt)}`, artist: "我的创作", audioUrl: url, durationMs: draft.durationMs ?? undefined });
    } catch (err) {
      toast(err instanceof Error ? err.message : "试听加载失败", "error");
    }
  }

  async function deleteDraft(id: string) {
    try {
      await api.delete(`/assets/${id}`);
      await refresh();
      toast("草稿已删除", "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="studio-surface h-20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="studio-surface rounded-lg p-10 text-center text-muted-foreground">
        <p>暂无草稿</p>
        <p className="mt-1 text-xs">生成完成后，作品会自动出现在这里。</p>
      </div>
    );
  }

  return (
    <>
      {publishedIds.size > 0 && (
        <div className="mb-4 rounded-lg border border-studio-gold/45 bg-studio-gold/10 p-4 text-sm text-studio-gold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            作品已发布
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary"><Link href="/library">曲库</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/charts">榜单</Link></Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {drafts.map((draft) => (
          <div key={draft.id} className={`studio-surface rounded-lg p-4 transition ${publishedIds.has(draft.id) ? "opacity-50" : ""}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-sm">
                  {publishedIds.has(draft.id) ? "已发布" : `草稿 · ${formatDate(draft.createdAt)}`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDuration(draft.durationMs)}
                  {draft.durationMs ? " · " : ""}
                  ID {draft.id.slice(0, 8)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => previewDraft(draft)}>
                  <Play className="size-3.5" />
                  试听
                </Button>
                {!publishedIds.has(draft.id) && (
                  <Button size="sm" onClick={() => openPublish(draft.id)}>
                    <Send className="size-3.5" />
                    发布
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteDraft(draft.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="studio-surface w-full max-w-md rounded-xl p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">发布作品</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setDialog(null)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">标题 <span className="text-destructive">*</span></label>
                <Input
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="为作品起一个名字"
                  onKeyDown={(e) => e.key === "Enter" && confirmPublish()}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">风格</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setForm((f) => ({ ...f, genre: g }))}
                      className={`rounded-full border px-3 py-1 text-xs transition ${form.genre === g ? "border-studio-gold bg-studio-gold/15 text-studio-gold" : "border-panel-border text-muted-foreground hover:border-studio-gold/45"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">可见性</label>
                <div className="flex gap-2">
                  {[{ value: "public", label: "公开" }, { value: "unlisted", label: "不公开" }].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, visibility: opt.value }))}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${form.visibility === opt.value ? "border-studio-gold bg-studio-gold/15 text-studio-gold" : "border-panel-border text-muted-foreground hover:border-studio-gold/45"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
              <Button onClick={confirmPublish} disabled={!!publishing}>
                {publishing ? "发布中…" : "确认发布"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
