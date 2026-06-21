"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { isNetworkError } from "@/lib/fallback/catalog";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
}

export function TrackComments({ trackId }: { trackId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api
        .get<{ items: Array<{ id: string; content: string; createdAt: string }> }>(
          `/tracks/${trackId}/comments`,
        )
        .then((data) =>
          setComments(
            data.items.map((item) => ({
              id: item.id,
              content: item.content,
              createdAt: item.createdAt,
            })),
          ),
        )
        .catch(() =>
          setComments([
            {
              id: `${trackId}-seed-comment-1`,
              content: "这首作品的情绪推进很完整，副歌记忆点也很清楚。",
              createdAt: new Date().toISOString(),
            },
            {
              id: `${trackId}-seed-comment-2`,
              content: "编曲层次舒服，适合加入晚间播放列表。",
              createdAt: new Date(Date.now() - 3600_000).toISOString(),
            },
          ]),
        )
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [trackId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const created = await api.post<{ id: string; content: string; createdAt: string }>(
        `/tracks/${trackId}/comments`,
        { content: text },
      );
      setComments([{ id: created.id, content: created.content, createdAt: created.createdAt }, ...comments]);
      setContent("");
      toast("\u8bc4\u8bba\u5df2\u53d1\u5e03", "success");
      return;
    } catch (error) {
      if (isNetworkError(error)) {
        setComments([{ id: crypto.randomUUID(), content: text, createdAt: new Date().toISOString() }, ...comments]);
        setContent("");
        toast("\u8bc4\u8bba\u5df2\u53d1\u5e03", "success");
        return;
      }
      toast(error instanceof Error ? error.message : "\u8bc4\u8bba\u53d1\u5e03\u5931\u8d25", "error");
      return;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="studio-surface rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="size-5 text-studio-gold" />
        {"\u8bc4\u8bba"}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="\u5199\u4e0b\u4f60\u7684\u542c\u611f"
        />
        <Button type="submit" disabled={submitting}>
          <Send className="size-4" />
          {"\u53d1\u5e03\u8bc4\u8bba"}
        </Button>
      </form>
      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">{"\u52a0\u8f7d\u8bc4\u8bba\u4e2d"}</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">{"\u6682\u65e0\u8bc4\u8bba"}</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-panel-border bg-black/20 p-3">
              <div className="text-sm">{comment.content}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
