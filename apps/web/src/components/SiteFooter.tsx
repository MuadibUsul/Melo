import Link from "next/link";
import { Music2 } from "lucide-react";

const columns = [
  {
    title: "产品",
    links: [
      { href: "/discover", label: "发现" },
      { href: "/studio", label: "创作" },
      { href: "/library", label: "曲库" },
      { href: "/pricing", label: "套餐" },
    ],
  },
  {
    title: "管理",
    links: [
      { href: "/account", label: "账号" },
      { href: "/login", label: "登录" },
      { href: "/admin", label: "后台" },
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
            Melo
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            发现、创作、收藏和分享中文 AI 音乐。
          </p>
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
          <span>© {new Date().getFullYear()} Melo</span>
          <span>Original Chinese AI music experience.</span>
        </div>
      </div>
    </footer>
  );
}
