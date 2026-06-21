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
  { href: "/discover", label: "\u53d1\u73b0", icon: Compass },
  { href: "/search", label: "\u641c\u7d22", icon: Search },
  { href: "/charts", label: "\u699c\u5355", icon: ListMusic },
  { href: "/categories", label: "\u5206\u7c7b", icon: Shapes },
  { href: "/library", label: "\u66f2\u5e93", icon: LibraryBig },
  { href: "/studio", label: "\u521b\u4f5c", icon: AudioLines },
  { href: "/pricing", label: "\u5957\u9910", icon: Tag },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon-sm" variant="outline" className="md:hidden" aria-label="\u6253\u5f00\u83dc\u5355">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-2">
        <SheetHeader>
          <SheetTitle>{"\u58f0\u6210\u97f3\u4e50"}</SheetTitle>
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
              {"\u767b\u5f55 / \u6ce8\u518c"}
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
