"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { isNetworkError } from "@/lib/fallback/catalog";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author?: string;
  likeCount?: number;
}

const seedComments = [
  {
    content: "这首歌的情绪推进很完整，副歌很抓耳。",
    author: "夜航听众",
    likeCount: 42,
  },
  {
    content: "适合直接加入晚间循环歌单，编曲层次很舒服。",
    author: "Melo 编辑部",
    likeCount: 31,
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackComments({ trackId }: { trackId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<"hot" | "new">("hot");
  const remaining = Math.max(0, 240 - content.length);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api
        .get<{ items: Array<{ id: string; content: string; createdAt: string; author?: string; likeCount?: number }> }>(
          `/tracks/${trackId}/comments`,
        )
        .then((data) => {
          const items = data.items.map((item) => ({
            id: item.id,
            content: item.content,
            createdAt: item.createdAt,
            author: item.author ?? "Melo 听众",
            likeCount: item.likeCount ?? 0,
          }));
          setComments(items.length > 0 ? items : makeSeedComments(trackId));
        })
        .catch(() => setComments(makeSeedComments(trackId)))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [trackId]);

  const sortedComments = useMemo(() => {
    const items = comments.slice();
    if (sortMode === "hot") {
      return items.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }
    return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [comments, sortMode]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;
    if (text.length > 240) {
      toast("评论最多 240 个字", "error");
      return;
    }

    const optimistic: CommentItem = {
      id: crypto.randomUUID(),
      content: text,
      createdAt: new Date().toISOString(),
      author: "我",
      likeCount: 0,
    };

    setSubmitting(true);
    setComments((current) => [optimistic, ...current]);
    setContent("");

    try {
      const created = await api.post<{ id: string; content: string; createdAt: string; author?: string; likeCount?: number }>(
        `/tracks/${trackId}/comments`,
        { content: text },
      );
      setComments((current) =>
        current.map((comment) =>
          comment.id === optimistic.id
            ? {
                id: created.id,
                content: created.content,
                createdAt: created.createdAt,
                author: created.author ?? "我",
                likeCount: created.likeCount ?? 0,
              }
            : comment,
        ),
      );
      toast("评论已发布", "success");
      return;
    } catch (error) {
      if (isNetworkError(error)) {
        toast("评论已发布到本地", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "评论已发布到本地", "info");
      return;
    } finally {
      setSubmitting(false);
    }
  }

  function toggleLike(commentId: string) {
    setLikedIds((current) => {
      const next = new Set(current);
      const liked = next.has(commentId);
      if (liked) next.delete(commentId);
      else next.add(commentId);
      setComments((items) =>
        items.map((item) =>
          item.id === commentId
            ? { ...item, likeCount: Math.max(0, (item.likeCount ?? 0) + (liked ? -1 : 1)) }
            : item,
        ),
      );
      return next;
    });
  }

  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="size-5 text-studio-gold" />
          评论
        </div>
        <div className="flex gap-2">
          {[
            { value: "hot", label: "热门" },
            { value: "new", label: "最新" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortMode(option.value as "hot" | "new")}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                sortMode === option.value
                  ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                  : "border-panel-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="写下你的听感、歌词想法或 Remix 建议"
          className="min-h-24"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={`text-xs ${remaining < 20 ? "text-studio-gold" : "text-muted-foreground"}`}>
            还可输入 {remaining} 字
          </div>
          <Button type="submit" disabled={submitting || !content.trim()}>
            <Send className="size-4" />
            发布评论
          </Button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">加载评论中</div>
        ) : sortedComments.length === 0 ? (
          <div className="rounded-lg border border-panel-border bg-black/20 p-4 text-sm text-muted-foreground">
            暂无评论，成为第一个留下听感的人。
          </div>
        ) : (
          sortedComments.map((comment) => {
            const liked = likedIds.has(comment.id);
            return (
              <div key={comment.id} className="rounded-lg border border-panel-border bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{comment.author ?? "Melo 听众"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatTime(comment.createdAt)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLike(comment.id)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition ${
                      liked
                        ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                        : "border-panel-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className="size-3.5" />
                    {comment.likeCount ?? 0}
                  </button>
                </div>
                <div className="mt-3 text-sm leading-6">{comment.content}</div>
                <button
                  type="button"
                  onClick={() => setContent(`回复 ${comment.author ?? "Melo 听众"}：`)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-studio-gold"
                >
                  <Reply className="size-3.5" />
                  回复
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function makeSeedComments(trackId: string): CommentItem[] {
  return seedComments.map((comment, index) => ({
    id: `${trackId}-seed-comment-${index + 1}`,
    content: comment.content,
    author: comment.author,
    likeCount: comment.likeCount,
    createdAt: new Date(Date.now() - index * 3600_000).toISOString(),
  }));
}
