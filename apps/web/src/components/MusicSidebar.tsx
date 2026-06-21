import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface CollectionItem {
  href: string;
  title: string;
  subtitle?: string;
}

interface GenreItem {
  title: string;
  href: string;
}

export function MusicSidebar({
  navItems,
  libraryItems,
  genres,
}: {
  navItems: NavItem[];
  libraryItems: CollectionItem[];
  genres: GenreItem[];
}) {
  return (
    <aside className="space-y-4">
      <div className="studio-surface rounded-lg p-3">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/5 hover:text-foreground"
              >
                <Icon className="size-4 text-studio-gold" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="studio-surface rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">{"\u4f60\u7684\u97f3\u4e50\u5e93"}</div>
          <Link href="/library" className="text-xs text-muted-foreground hover:text-foreground">
            {"\u6253\u5f00"}
          </Link>
        </div>
        <div className="space-y-2">
          {libraryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-panel-border bg-black/20 px-3 py-2.5 transition hover:border-studio-gold/45"
            >
              <div className="truncate text-sm font-medium">{item.title}</div>
              {item.subtitle ? (
                <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      <div className="studio-surface rounded-lg p-4">
        <div className="text-sm font-semibold">{"\u98ce\u683c"}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {genres.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-full border border-panel-border px-3 py-1.5 text-xs transition hover:border-studio-gold/45 hover:text-studio-gold"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
