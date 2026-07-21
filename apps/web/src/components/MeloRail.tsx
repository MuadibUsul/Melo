"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AudioLines,
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Compass,
  FlaskConical,
  Home,
  Library,
  ListMusic,
  LogIn,
  LogOut,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Radio,
  Search,
  SlidersHorizontal,
  Sparkles,
  ScrollText,
  Telescope,
  Trophy,
  Webhook,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { usePlayerStore } from "@/lib/player/use-player-store";
import { cn } from "@/lib/utils";

const discoverDetailAliases = ["/", "/categories", "/tracks", "/playlists", "/playlist", "/creators", "/song"];

const primaryLinks = [
  { href: "/discover", label: "首页", icon: Home, aliases: discoverDetailAliases },
  { href: "/create", label: "创作", icon: AudioLines },
  { href: "/studio", label: "工作室", icon: SlidersHorizontal },
  { href: "/explore", label: "探索", icon: Telescope },
  { href: "/hooks", label: "Hooks", icon: Webhook },
  { href: "/search", label: "搜索", icon: Search },
  { href: "/charts", label: "榜单", icon: Trophy },
  { href: "/me", label: "资料库", icon: Library, aliases: ["/account", "/library"] },
];

const secondaryLinks = [
  { href: "/listen-and-rank", label: "赚取额度", icon: BadgeDollarSign },
  { href: "/labs", label: "实验室", icon: FlaskConical },
  { href: "/pricing", label: "套餐", icon: Sparkles },
];
const policyLinks = [
  { href: "/terms#service", label: "服务条款" },
  { href: "/terms#copyright", label: "内容与版权" },
  { href: "/terms#privacy", label: "隐私与安全" },
  { href: "/terms#community", label: "社区准则" },
];
const RAIL_COLLAPSED_KEY = "melo.rail.collapsed";

function isActive(pathname: string, link: { href: string; aliases?: string[] }) {
  if (pathname === link.href || pathname.startsWith(`${link.href}/`)) return true;
  return link.aliases?.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`)) ?? false;
}

export function MeloRail() {
  const pathname = usePathname();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const accountLink = auth.user
    ? { href: "/me", label: "我的", icon: CircleUserRound, aliases: ["/account"] }
    : { href: "/login", label: "登录", icon: LogIn, aliases: ["/signin", "/sign-in"] };
  const moreLinks = [
    { href: "/create", label: "打开创作台", icon: AudioLines },
    { href: "/studio", label: "进入工作室", icon: SlidersHorizontal },
    { href: "/hooks", label: "Hooks 灵感", icon: Webhook },
    { href: "/listen-and-rank", label: "赚取额度", icon: BadgeDollarSign },
    { href: "/labs", label: "实验室", icon: FlaskConical },
    { href: "/pricing", label: "套餐与额度", icon: Sparkles },
    { href: "/terms", label: "条款政策", icon: ScrollText },
    { href: "/library", label: "我的音乐库", icon: Library },
    { href: accountLink.href, label: auth.user ? "账号中心" : "登录 / 注册", icon: accountLink.icon },
  ];

  const railCollapsed = isHydrated ? collapsed : false;
  const railTrack = isHydrated ? currentTrack : null;
  const railIsPlaying = isHydrated ? isPlaying : false;

  useEffect(() => {
    document.documentElement.dataset.meloRailCollapsed = String(railCollapsed);
  }, [railCollapsed]);

  useEffect(() => {
    const saved = window.localStorage.getItem(RAIL_COLLAPSED_KEY) === "true";
    const timer = window.setTimeout(() => {
      setCollapsed(saved);
      setIsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(RAIL_COLLAPSED_KEY, String(next));
      document.documentElement.dataset.meloRailCollapsed = String(next);
      return next;
    });
  }

  async function signOut() {
    try {
      await auth.logout();
      setMoreOpen(false);
      toast("已退出登录", "success");
      window.dispatchEvent(new Event("credits-updated"));
      window.location.href = "/discover";
    } catch (error) {
      toast(error instanceof Error ? error.message : "退出失败，请稍后再试。", "error");
    }
  }

  return (
    <aside
      className={cn(
        "melo-rail fixed inset-y-0 left-0 z-40 hidden border-r border-panel-border bg-background/95 py-6 backdrop-blur-xl transition-[width,padding] duration-200 md:flex md:flex-col",
        railCollapsed ? "w-[72px] px-3" : "w-[200px] px-4",
      )}
      data-collapsed={railCollapsed ? "true" : "false"}
    >
      <div className={cn("mb-9 flex items-center", railCollapsed ? "justify-center" : "justify-between")}>
        <Link
          href="/discover"
          className={cn("flex items-center gap-3 text-xl font-semibold tracking-wide", railCollapsed && "justify-center")}
          title="Melo"
          aria-label="Melo 首页"
        >
          <span className="studio-metal flex size-10 items-center justify-center rounded-lg border border-panel-border">
            <Music2 className="size-4 text-studio-gold" />
          </span>
          <span className={cn(railCollapsed && "sr-only")}>Melo</span>
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground",
            railCollapsed && "absolute left-[58px] top-8 border border-panel-border bg-background",
          )}
          aria-label={railCollapsed ? "展开导航" : "收起导航"}
          title={railCollapsed ? "展开导航" : "收起导航"}
        >
          {railCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              title={railCollapsed ? link.label : undefined}
              className={cn(
                "group flex items-center rounded-lg py-2.5 text-sm transition",
                railCollapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-studio-gold/12 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md bg-white/[0.04]",
                  active ? "text-studio-gold" : "text-muted-foreground group-hover:text-studio-gold",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className={cn(railCollapsed && "sr-only")}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("mb-4 rounded-lg border border-panel-border bg-black/25", railCollapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center", railCollapsed ? "justify-center" : "gap-3")}>
          <button
            type="button"
            onClick={railTrack ? togglePlay : undefined}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-panel-border bg-white/[0.04] text-studio-gold"
            aria-label={railTrack ? (railIsPlaying ? "暂停播放" : "继续播放") : "Melo 电台"}
            title={railTrack ? railTrack.title : "Melo 电台"}
          >
            {railTrack ? (
              railIsPlaying ? <Pause className="size-4" /> : <Play className="size-4" />
            ) : (
              <Radio className="size-4" />
            )}
          </button>
          <div className={cn("min-w-0 flex-1", railCollapsed && "sr-only")}>
            <div className="truncate text-sm font-medium">{railTrack?.title ?? "Melo 电台"}</div>
            <div className="truncate text-xs text-muted-foreground">{railTrack?.artist ?? "等待播放"}</div>
          </div>
        </div>
        {railTrack && !railCollapsed ? (
          <button
            type="button"
            onClick={() => setQueueOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-panel-border bg-black/20 px-3 py-2 text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
          >
            <ListMusic className="size-3.5" />
            播放队列
          </button>
        ) : !railCollapsed ? (
          <Link
            href="/discover"
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-panel-border bg-black/20 px-3 py-2 text-xs text-muted-foreground transition hover:border-studio-gold/45 hover:text-foreground"
          >
            浏览热门歌曲
          </Link>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1 border-t border-panel-border pt-4">
        {[...secondaryLinks, accountLink].map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              title={railCollapsed ? link.label : undefined}
              className={cn(
                "group flex items-center rounded-lg py-2.5 text-sm transition",
                railCollapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-studio-gold/12 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md bg-white/[0.04]",
                  active ? "text-studio-gold" : "group-hover:text-studio-gold",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className={cn(railCollapsed && "sr-only")}>{link.label}</span>
            </Link>
          );
        })}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPoliciesOpen((open) => !open)}
            className={cn(
              "group flex w-full items-center rounded-lg py-2.5 text-sm transition",
              railCollapsed ? "justify-center px-0" : "gap-3 px-3",
              pathname.startsWith("/terms")
                ? "bg-studio-gold/12 text-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
            aria-expanded={policiesOpen}
            aria-label="条款政策"
            title={railCollapsed ? "条款政策" : undefined}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-md bg-white/[0.04]",
                pathname.startsWith("/terms") ? "text-studio-gold" : "group-hover:text-studio-gold",
              )}
            >
              <ScrollText className="size-4" />
            </span>
            <span className={cn(railCollapsed && "sr-only")}>条款政策</span>
          </button>
          {policiesOpen ? (
            <div
              className={cn(
                "z-50 rounded-lg border border-panel-border bg-[#111317] p-1 text-sm shadow-2xl",
                railCollapsed
                  ? "absolute bottom-0 left-[calc(100%+0.75rem)] w-48"
                  : "mt-1 w-full bg-black/20 shadow-none",
              )}
            >
              {policyLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-2 py-2 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "group flex w-full items-center rounded-lg py-2.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground",
              railCollapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
            aria-label="更多 Melo"
            aria-expanded={moreOpen}
            title={railCollapsed ? "更多 Melo" : undefined}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-white/[0.04] group-hover:text-studio-gold">
              <MoreHorizontal className="size-4" />
            </span>
            <span className={cn(railCollapsed && "sr-only")}>更多 Melo</span>
          </button>
          {moreOpen ? (
            <div className="absolute bottom-0 left-[calc(100%+0.75rem)] z-50 w-56 rounded-lg border border-panel-border bg-[#111317] p-1 text-sm shadow-2xl">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Melo</div>
              {moreLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                  >
                    <Icon className="size-4" />
                    {link.label}
                  </Link>
                );
              })}
              {auth.user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  退出登录
                </button>
              ) : null}
              <div className="my-1 h-px bg-panel-border" />
              <Link
                href="/discover"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                <Compass className="size-4" />
                回到发现页
              </Link>
            </div>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
