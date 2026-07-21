"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AudioLines,
  BadgeDollarSign,
  Compass,
  FlaskConical,
  Home,
  LibraryBig,
  LogIn,
  LogOut,
  MoreHorizontal,
  ScrollText,
  Search,
  SlidersHorizontal,
  Sparkles,
  User,
  Webhook,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const mobileDiscoverAliases = [
  "/",
  "/search",
  "/charts",
  "/categories",
  "/tracks",
  "/playlists",
  "/playlist",
  "/creators",
  "/song",
];

const dockLinks = [
  { href: "/discover", label: "首页", icon: Home, aliases: mobileDiscoverAliases },
  { href: "/me", label: "资料库", icon: LibraryBig, aliases: ["/library", "/account"] },
  { href: "/create", label: "创作", icon: AudioLines },
  { href: "/explore", label: "探索", icon: Compass },
];

const moreLinks = [
  { href: "/search", label: "搜索", icon: Search },
  { href: "/studio", label: "工作室", icon: SlidersHorizontal },
  { href: "/hooks", label: "Hooks", icon: Webhook },
  { href: "/listen-and-rank", label: "赚取额度", icon: BadgeDollarSign },
  { href: "/labs", label: "实验室", icon: FlaskConical },
  { href: "/pricing", label: "套餐与额度", icon: Sparkles },
  { href: "/terms", label: "条款政策", icon: ScrollText },
];

function isActive(pathname: string, link: { href: string; aliases?: string[] }) {
  if (pathname === link.href || pathname.startsWith(`${link.href}/`)) return true;
  return link.aliases?.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`)) ?? false;
}

export function MeloMobileDock() {
  const pathname = usePathname();
  const auth = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const accountLinks = auth.user
    ? [
        { href: "/account", label: "账号中心", icon: User },
        { href: "/library", label: "我的曲库", icon: LibraryBig },
      ]
    : [{ href: "/login", label: "登录 / 注册", icon: LogIn }];
  const visibleMoreLinks = [...moreLinks, ...accountLinks];

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
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-panel-border bg-black/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl md:hidden"
      aria-label="Melo 移动导航"
    >
      {moreOpen ? (
        <div className="mb-2 rounded-lg border border-panel-border bg-[#111317] p-2 shadow-2xl">
          <div className="px-2 pb-1 text-xs text-muted-foreground">更多 Melo</div>
          <div className="grid gap-1">
            {visibleMoreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  <Icon className="size-4 text-studio-gold" />
                  {link.label}
                </Link>
              );
            })}
            {auth.user ? (
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                退出登录
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-5 items-center gap-1">
        {dockLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link);
          const isCreate = link.href === "/create";
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-1 rounded-full text-[11px] transition",
                isCreate
                  ? "bg-studio-gold/15 text-studio-gold"
                  : active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5", isCreate && "size-6")} />
              <span className={cn(isCreate && "sr-only")}>{link.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            "flex h-12 flex-col items-center justify-center gap-1 rounded-full text-[11px] text-muted-foreground transition hover:text-foreground",
            moreOpen && "text-foreground",
          )}
          aria-label="更多 Melo"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal className="size-5" />
          <span>更多</span>
        </button>
      </div>
    </nav>
  );
}
