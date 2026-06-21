import Link from "next/link";
import { Music2 } from "lucide-react";

const columns = [
  {
    title: "\u4ea7\u54c1",
    links: [
      { href: "/studio", label: "\u521b\u4f5c" },
      { href: "/library", label: "\u66f2\u5e93" },
      { href: "/pricing", label: "\u5957\u9910" },
    ],
  },
  {
    title: "\u7ba1\u7406",
    links: [
      { href: "/login", label: "\u767b\u5f55" },
      { href: "/admin", label: "\u540e\u53f0" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-8 border-t border-panel-border">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3 font-semibold">
            <span className="studio-metal flex size-9 items-center justify-center rounded-lg border border-panel-border">
              <Music2 className="size-4 text-studio-gold" />
            </span>
            {"\u58f0\u6210\u97f3\u4e50"}
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-studio-gold">{column.title}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-panel-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            {"\u00a9"} {new Date().getFullYear()} {"\u58f0\u6210\u97f3\u4e50"}
          </span>
        </div>
      </div>
    </footer>
  );
}
