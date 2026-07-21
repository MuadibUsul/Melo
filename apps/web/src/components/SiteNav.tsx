import Link from "next/link";
import { AudioLines, Compass, Library, Music2, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "./CreditBadge";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

export function SiteNav() {
  const links = [
    { href: "/discover", label: "发现", icon: Compass },
    { href: "/search", label: "搜索", icon: Search },
    { href: "/charts", label: "榜单", icon: Trophy },
    { href: "/library", label: "音乐库", icon: Library },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-panel-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="studio-metal flex size-9 items-center justify-center rounded-lg border border-panel-border">
            <Music2 className="size-4 text-studio-gold" />
          </span>
          <span className="leading-tight">Melo</span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <CreditBadge />
          <UserMenu />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/studio">
              <AudioLines className="size-4" />
              创作
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
