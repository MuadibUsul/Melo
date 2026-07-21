"use client";

import { useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function PlaylistActions({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${title} - Melo`, url }).catch(() => null);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => null);
    toast("歌单链接已复制", "success");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          const next = !saved;
          setSaved(next);
          toast(next ? "已保存歌单" : "已取消保存", "success");
        }}
      >
        {saved ? <Check className="size-4" /> : <Heart className="size-4" />}
        {saved ? "已保存" : "保存歌单"}
      </Button>
      <Button variant="outline" onClick={share}>
        <Share2 className="size-4" />
        分享
      </Button>
    </div>
  );
}
