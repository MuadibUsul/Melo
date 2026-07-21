"use client";

import { useState } from "react";
import Link from "next/link";
import { AudioLines, Compass, LibraryBig, ListMusic, Menu, Search, Shapes, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/discover", label: "发现", icon: Compass },
  { href: "/search", label: "搜索", icon: Search },
  { href: "/charts", label: "榜单", icon: ListMusic },
  { href: "/categories", label: "分类", icon: Shapes },
  { href: "/library", label: "音乐库", icon: LibraryBig },
  { href: "/studio", label: "创作", icon: AudioLines },
  { href: "/pricing", label: "套餐", icon: Tag },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon-sm" variant="outline" className="md:hidden" aria-label="打开菜单">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-2">
        <SheetHeader>
          <SheetTitle>Melo</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-white/5"
                >
                  <Icon className="size-4 text-studio-gold" />
                  {link.label}
                </Link>
              </SheetClose>
            );
          })}
          <SheetClose asChild>
            <Link
              href="/login"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-panel-border bg-black/20 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              登录 / 注册
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
