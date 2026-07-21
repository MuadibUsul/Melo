"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { CreditBadge } from "@/components/CreditBadge";
import { UserMenu } from "@/components/UserMenu";

const searchSuggestions = [
  { label: "国风", detail: "弦乐、诗意、电子融合", href: "/search?q=%E5%9B%BD%E9%A3%8E" },
  { label: "Lo-fi", detail: "专注、雨声、柔和钢琴", href: "/search?q=Lo-fi" },
  { label: "中文流行", detail: "副歌、女声、城市夜色", href: "/search?q=%E4%B8%AD%E6%96%87%E6%B5%81%E8%A1%8C" },
  { label: "影视配乐", detail: "画面感、铺陈、情绪推进", href: "/search?q=%E5%BD%B1%E8%A7%86%E9%85%8D%E4%B9%90" },
];

export function MeloTopBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const trimmedQuery = query.trim();

  return (
    <header className="melo-rail-offset pointer-events-none fixed left-0 right-0 top-0 z-30 hidden md:block">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-end gap-3 px-4 sm:px-6">
        <form
          action="/search"
          role="search"
          aria-label="搜索 Melo"
          className="pointer-events-auto relative"
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        >
          <label className="sr-only" htmlFor="melo-top-search">
            搜索 Melo
          </label>
          <div className="flex h-10 w-[min(28vw,360px)] items-center gap-2 rounded-full border border-panel-border bg-background/82 px-3 text-muted-foreground shadow-lg backdrop-blur-xl transition focus-within:border-studio-gold/45 focus-within:text-foreground">
            <Search className="size-4 shrink-0" />
            <input
              id="melo-top-search"
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索歌曲、歌单或创作者"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {open ? (
            <div className="absolute right-0 top-12 w-[min(28vw,360px)] overflow-hidden rounded-lg border border-panel-border bg-[#101216]/95 p-2 shadow-2xl backdrop-blur-xl">
              {trimmedQuery ? (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                  className="mb-2 flex items-center gap-3 rounded-lg border border-studio-gold/25 bg-studio-gold/8 px-3 py-2.5 text-sm transition hover:border-studio-gold/45"
                >
                  <Search className="size-4 text-studio-gold" />
                  <span className="min-w-0 flex-1 truncate">搜索“{trimmedQuery}”</span>
                </Link>
              ) : null}
              <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">热门搜索</div>
              <div className="grid gap-1">
                {searchSuggestions.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/[0.06]"
                  >
                    <Sparkles className="size-3.5 shrink-0 text-studio-gold" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{item.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </form>
        <div className="pointer-events-auto">
          <CreditBadge />
        </div>
        <div className="pointer-events-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
