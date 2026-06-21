"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LibraryBig, LogIn, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";

export function UserMenu() {
  const auth = useAuth();

  async function signOut() {
    try {
      await auth.logout();
      toast("\u5df2\u9000\u51fa\u767b\u5f55", "success");
      window.dispatchEvent(new Event("credits-updated"));
      window.location.href = "/";
    } catch (error) {
      toast(error instanceof Error ? error.message : "\u9000\u51fa\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002", "error");
    }
  }

  if (auth.isLoading) {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-white/5" aria-hidden="true" />;
  }

  if (!auth.user) {
    return (
      <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
        <Link href="/login">
          <LogIn className="size-4" />
          {"\u767b\u5f55"}
        </Link>
      </Button>
    );
  }

  const name = auth.user.displayName || auth.user.email?.split("@")[0] || "\u7528\u6237";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-studio-gold/20 text-studio-gold">
            <User className="size-3" />
          </span>
          <span className="hidden max-w-24 truncate sm:inline">{name}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{auth.user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="size-4" />
            {"\u8d26\u53f7\u4e2d\u5fc3"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/library">
            <LibraryBig className="size-4" />
            {"\u6211\u7684\u66f2\u5e93"}
          </Link>
        </DropdownMenuItem>
        {auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard className="size-4" />
              {"\u7ba1\u7406\u540e\u53f0"}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut className="size-4" />
          {"\u9000\u51fa\u767b\u5f55"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
