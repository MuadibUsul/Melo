"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const studioLinks = [
  { href: "/studio/simple", label: "快速创作" },
  { href: "/studio/pro", label: "自定义" },
  { href: "/studio/editor", label: "歌曲编辑器" },
  { href: "/studio/projects", label: "项目" },
  { href: "/studio/drafts", label: "草稿" },
  { href: "/studio/presets", label: "提示预设" },
  { href: "/studio/voices", label: "声音与人设" },
];

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="创作导航">
      {studioLinks.map((link) => {
        const active = pathname === link.href || (pathname === "/studio" && link.href === "/studio/simple");
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-sm transition",
              active
                ? "border-studio-gold/45 bg-studio-gold/10 text-studio-gold"
                : "border-panel-border text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
