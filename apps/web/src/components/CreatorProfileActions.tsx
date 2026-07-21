"use client";

import { useState } from "react";
import { Bell, Share2, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function CreatorProfileActions({ creatorName }: { creatorName: string }) {
  const [following, setFollowing] = useState(false);
  const [notifications, setNotifications] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${creatorName} - Melo`, url }).catch(() => null);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => null);
    toast("主页链接已复制", "success");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          const next = !following;
          setFollowing(next);
          toast(next ? `已关注 ${creatorName}` : `已取消关注 ${creatorName}`, "success");
        }}
      >
        {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
        {following ? "已关注" : "关注"}
      </Button>
      <Button
        variant={notifications ? "secondary" : "outline"}
        onClick={() => {
          const next = !notifications;
          setNotifications(next);
          toast(next ? "已开启新作品提醒" : "已关闭新作品提醒", "info");
        }}
      >
        <Bell className="size-4" />
        新作品提醒
      </Button>
      <Button variant="outline" onClick={share}>
        <Share2 className="size-4" />
        分享
      </Button>
    </div>
  );
}
