"use client";

import Link from "next/link";
import { ArrowRight, Music2, User } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export function MeloMobileTopBar() {
  const auth = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-panel-border bg-background/92 backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/discover" className="flex items-center gap-3 font-semibold" aria-label="Melo 首页">
          <span className="studio-metal flex size-9 items-center justify-center rounded-lg border border-panel-border">
            <Music2 className="size-4 text-studio-gold" />
          </span>
          <span>Melo</span>
        </Link>

        {auth.isLoading ? (
          <div className="h-9 w-28 animate-pulse rounded-lg bg-white/5" aria-hidden="true" />
        ) : auth.user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              aria-label="账号中心"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-panel-border text-studio-gold transition hover:border-studio-gold/45"
            >
              <User className="size-4" />
            </Link>
            <Link
              href="/studio"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              打开 App
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg border border-panel-border px-3 text-sm font-medium transition hover:border-studio-gold/45"
            >
              登录
            </Link>
            <Link
              href="/create"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              打开 App
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
