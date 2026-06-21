import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function AdminPage() {
  const modules = [
    { href: "/admin/content", title: "\u5185\u5bb9\u5ba1\u6838", desc: "\u5ba1\u6838\u4f5c\u54c1\u4e0e\u4e3e\u62a5" },
    { href: "/admin/users", title: "\u7528\u6237\u7ba1\u7406", desc: "\u67e5\u770b\u8d26\u53f7\u4e0e\u89d2\u8272" },
    { href: "/admin/billing", title: "\u8ba1\u8d39\u7ba1\u7406", desc: "\u67e5\u770b\u8ba2\u9605\u4e0e\u989d\u5ea6" },
    { href: "/admin/costs", title: "\u6210\u672c\u76d1\u63a7", desc: "\u67e5\u770b\u8c03\u7528\u4e0e\u6210\u672c" },
  ];

  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="后台" title="\u8fd0\u8425\u540e\u53f0">
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="studio-surface rounded-lg p-5 transition hover:border-studio-gold/45"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>
      </StudioShell>
    </>
  );
}
