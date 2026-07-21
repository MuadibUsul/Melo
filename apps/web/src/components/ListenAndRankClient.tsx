"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Headphones, ListChecks, Play, RotateCcw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { getSeedTracks } from "@/lib/fallback/catalog";
import { usePlayerStore, type PlayerTrack } from "@/lib/player/use-player-store";

const SESSION_KEY = "melo.listenRank.session";
const LOCAL_USER_KEY = "melo.demo.user";
const REWARD_PER_PICK = 3;

interface RankSession {
  completed: number;
  creditsEarned: number;
  picks: Array<{ pairId: string; winnerId: string; createdAt: string }>;
}

function readSession(): RankSession {
  if (typeof window === "undefined") return { completed: 0, creditsEarned: 0, picks: [] };
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return { completed: 0, creditsEarned: 0, picks: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<RankSession>;
    return {
      completed: parsed.completed ?? 0,
      creditsEarned: parsed.creditsEarned ?? 0,
      picks: Array.isArray(parsed.picks) ? parsed.picks : [],
    };
  } catch {
    return { completed: 0, creditsEarned: 0, picks: [] };
  }
}

function writeSession(session: RankSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function rewardLocalDemoUser(amount: number) {
  const raw = window.localStorage.getItem(LOCAL_USER_KEY);
  if (!raw) return false;
  try {
    const user = JSON.parse(raw) as { credits?: number };
    const nextUser = { ...user, credits: (user.credits ?? 0) + amount };
    window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(nextUser));
    window.dispatchEvent(new Event("credits-updated"));
    return true;
  } catch {
    return false;
  }
}

function toPlayerTrack(track: ReturnType<typeof getSeedTracks>[number]): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.creator.displayName,
    coverUrl: `/api/melo-artwork/${track.id}`,
    audioUrl: track.audioUrl,
    durationMs: track.durationMs,
  };
}

export function ListenAndRankClient() {
  const auth = useAuth();
  const player = usePlayerStore();
  const tracks = useMemo(() => getSeedTracks().slice(0, 6), []);
  const pairs = useMemo(
    () => [
      [tracks[0]!, tracks[1]!],
      [tracks[2]!, tracks[3]!],
      [tracks[4]!, tracks[5]!],
    ],
    [tracks],
  );
  const [session, setSession] = useState<RankSession>(() => readSession());
  const pairIndex = session.completed % pairs.length;
  const pair = pairs[pairIndex] ?? pairs[0]!;
  const progress = Math.min(100, Math.round((session.completed / 5) * 100));

  function playPair(startIndex: number) {
    player.playQueue(pair.map(toPlayerTrack), startIndex, { title: "赚取额度 · A/B 评审", href: "/listen-and-rank" });
  }

  function chooseWinner(winnerId: string) {
    if (!auth.user) {
      toast("登录后才能领取评审额度。", "error");
      return;
    }

    const nextSession: RankSession = {
      completed: session.completed + 1,
      creditsEarned: session.creditsEarned + REWARD_PER_PICK,
      picks: [
        {
          pairId: `${pair[0].id}:${pair[1].id}`,
          winnerId,
          createdAt: new Date().toISOString(),
        },
        ...session.picks,
      ].slice(0, 12),
    };
    writeSession(nextSession);
    setSession(nextSession);
    rewardLocalDemoUser(REWARD_PER_PICK);
    toast(`已记录偏好，获得 +${REWARD_PER_PICK} 额度。`, "success");
  }

  function resetSession() {
    const nextSession = { completed: 0, creditsEarned: 0, picks: [] };
    writeSession(nextSession);
    setSession(nextSession);
    toast("已重置本地评审进度。", "success");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="studio-surface rounded-lg p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Headphones className="size-3.5 text-studio-gold" />
              Listen and Rank
            </div>
            <h2 className="mt-2 text-2xl font-semibold">听两首候选歌，选出更接近提示词的一版</h2>
          </div>
          <Badge variant="secondary" className="border border-meter-green/30 bg-meter-green/10 text-meter-green">
            +{REWARD_PER_PICK} 额度 / 次
          </Badge>
        </div>

        <div className="mb-5 rounded-lg border border-panel-border bg-black/25 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>今日评审进度</span>
            <span>{session.completed} / 5</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full bg-meter-green transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {pair.map((track, index) => (
            <article key={track.id} className="rounded-lg border border-panel-border bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">版本 {index === 0 ? "A" : "B"}</div>
                  <h3 className="mt-1 truncate text-lg font-semibold">{track.title}</h3>
                  <p className="truncate text-sm text-muted-foreground">{track.creator.displayName} · {track.genre}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => playPair(index)} aria-label={`播放版本 ${index === 0 ? "A" : "B"}`}>
                  <Play className="size-4 text-studio-gold" />
                </Button>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{track.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {track.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button className="mt-4 w-full" variant={index === 0 ? "default" : "secondary"} onClick={() => chooseWinner(track.id)}>
                选择版本 {index === 0 ? "A" : "B"}
              </Button>
            </article>
          ))}
        </div>

        {!auth.user ? (
          <div className="mt-4 rounded-lg border border-studio-gold/25 bg-studio-gold/8 p-3 text-sm text-muted-foreground">
            登录后会把评审奖励写入你的 Melo 额度。
            <Link href="/login?next=/listen-and-rank" className="ml-2 text-studio-gold hover:underline">
              登录 / 注册
            </Link>
          </div>
        ) : null}
      </div>

      <aside className="grid gap-3">
        <div className="studio-surface rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BadgeDollarSign className="size-4 text-meter-green" />
            本地奖励
          </div>
          <div className="mt-4 text-3xl font-semibold text-meter-green">+{session.creditsEarned}</div>
          <p className="mt-1 text-sm text-muted-foreground">已通过评审获得的演示额度。</p>
        </div>

        <div className="studio-surface rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="size-4 text-studio-gold" />
              最近选择
            </div>
            <Button variant="ghost" size="icon-sm" onClick={resetSession} title="重置进度">
              <RotateCcw className="size-4" />
            </Button>
          </div>
          {session.picks.length ? (
            <div className="space-y-2">
              {session.picks.slice(0, 4).map((pick) => (
                <div key={`${pick.pairId}-${pick.createdAt}`} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2 py-2 text-xs">
                  <CheckCircle2 className="size-3.5 text-meter-green" />
                  <span className="truncate">已选择 {tracks.find((track) => track.id === pick.winnerId)?.title ?? "候选版本"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">还没有评审记录。先播放 A/B 两版，再选择更好的一首。</p>
          )}
        </div>

        <div className="studio-surface rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="size-4 text-studio-gold" />
            完成 5 次
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            完成一组评审后，可以回到创作台使用额度继续生成歌曲。
          </p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href="/create">去创作</Link>
          </Button>
        </div>
      </aside>
    </section>
  );
}
