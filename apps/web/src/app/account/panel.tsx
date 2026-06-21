"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

export function AccountPanel() {
  const auth = useAuth();
  const { data: balance } = useQuery({
    queryKey: ["entitlement-balance"],
    queryFn: () => api.get<{ balance: number }>("/entitlement/balance"),
    enabled: !!auth.user,
    retry: 0,
  });
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.get<{ status: string; plan?: { name?: string } } | null>("/subscription"),
    enabled: !!auth.user,
    retry: 0,
  });

  if (!auth.user) {
    return (
      <div className="studio-surface rounded-lg p-6">
        <p className="text-muted-foreground">{"\u8bf7\u5148\u767b\u5f55\u3002"}</p>
        <Button asChild className="mt-4">
          <Link href="/login">{"\u767b\u5f55"}</Link>
        </Button>
      </div>
    );
  }

  const stats = [
    ["\u8d26\u53f7", auth.user.displayName],
    ["\u90ae\u7bb1", auth.user.email ?? "-"],
    ["\u89d2\u8272", auth.user.role],
    ["\u5f53\u524d\u989d\u5ea6", `${balance?.balance ?? 0}`],
    ["\u8ba2\u9605", subscription?.plan?.name ?? subscription?.status ?? "\u514d\u8d39\u7248"],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map(([label, value]) => (
        <div key={label} className="studio-surface rounded-lg p-5">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-xl font-semibold">{value}</div>
        </div>
      ))}
      <div className="studio-surface rounded-lg p-5 md:col-span-2">
        <h2 className="mb-3 text-sm font-semibold">\u5feb\u6377\u64cd\u4f5c</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/studio" className="rounded-lg border border-panel-border px-4 py-2 text-sm transition hover:border-studio-gold/45">\u521b\u4f5c\u5de5\u4f5c\u53f0</a>
          <a href="/studio/drafts" className="rounded-lg border border-panel-border px-4 py-2 text-sm transition hover:border-studio-gold/45">\u6211\u7684\u8349\u7a3f</a>
          <a href="/library" className="rounded-lg border border-panel-border px-4 py-2 text-sm transition hover:border-studio-gold/45">\u4f5c\u54c1\u5e93</a>
          <a href="/pricing" className="rounded-lg border border-panel-border px-4 py-2 text-sm transition hover:border-studio-gold/45">\u5347\u7ea7\u5957\u9910</a>
        </div>
      </div>
    </div>
  );
}
