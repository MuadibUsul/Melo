"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const studioLinks = [
  { href: "/studio/simple", label: "\u7b80\u6613\u6a21\u5f0f" },
  { href: "/studio/pro", label: "\u4e13\u4e1a\u6a21\u5f0f" },
  { href: "/studio/projects", label: "\u9879\u76ee" },
  { href: "/studio/drafts", label: "\u8349\u7a3f" },
  { href: "/studio/presets", label: "\u9884\u8bbe" },
  { href: "/studio/voices", label: "\u97f3\u8272" },
];

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {studioLinks.map((link) => {
        const active = pathname === link.href || (pathname === "/studio" && link.href === "/studio/simple");
        return (
          <Link
            key={link.href}
            href={link.href}
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
