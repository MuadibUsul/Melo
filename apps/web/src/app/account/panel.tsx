"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Coins, CreditCard, KeyRound, Library, ShieldCheck, Sparkles, UserRound } from "lucide-react";
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
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="studio-surface rounded-lg p-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <UserRound className="size-5 text-studio-gold" />
            请先登录
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            登录后可以查看创作额度、订阅状态、草稿、发布作品和账号安全设置。未登录时仍可浏览发现页和配置创作提示词。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/login">登录 / 注册</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/discover">先逛发现页</Link>
            </Button>
          </div>
        </div>
        <div className="studio-surface rounded-lg p-5">
          <div className="text-sm font-semibold">登录后可用</div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            {["保存生成草稿", "查看额度消耗", "管理订阅权益", "发布作品到音乐库"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-meter-green" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const planName = subscription?.plan?.name ?? subscription?.status ?? "免费版";
  const stats = [
    { icon: UserRound, label: "账号", value: auth.user.displayName, detail: auth.user.email ?? "未绑定邮箱" },
    { icon: Coins, label: "当前额度", value: `${balance?.balance ?? 0}`, detail: "用于生成歌曲、上传参考音频和高级编辑" },
    { icon: CreditCard, label: "订阅", value: planName, detail: "套餐权益、商用授权和优先队列" },
    { icon: ShieldCheck, label: "角色", value: auth.user.role, detail: "账号权限与后台访问范围" },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="studio-surface rounded-lg p-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {item.label}
                <Icon className="size-4 text-studio-gold" />
              </div>
              <div className="mt-3 truncate text-2xl font-semibold">{item.value}</div>
              <div className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{item.detail}</div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="studio-surface rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">创作账户</h2>
              <p className="mt-1 text-sm text-muted-foreground">管理从生成到发布的个人工作流。</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">升级套餐</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Sparkles, title: "创作工作台", text: "继续生成歌曲、切换简单/自定义模式。", href: "/studio" },
              { icon: Library, title: "作品与收藏", text: "查看发布作品、喜欢的音乐和歌单。", href: "/library" },
              { icon: Coins, title: "额度与套餐", text: "查看剩余额度、月度刷新和商用权益。", href: "/pricing" },
              { icon: KeyRound, title: "安全与登录", text: "后续可管理密码、登录设备和授权应用。", href: "/account" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-lg border border-panel-border bg-black/20 p-4 transition hover:border-studio-gold/45"
                >
                  <Icon className="size-4 text-studio-gold" />
                  <div className="mt-3 text-sm font-medium">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="studio-surface rounded-lg p-5">
            <div className="text-lg font-semibold">额度状态</div>
            <div className="mt-4 rounded-lg border border-studio-gold/35 bg-studio-gold/10 p-4">
              <div className="text-sm text-muted-foreground">可用额度</div>
              <div className="mt-2 text-3xl font-semibold text-studio-gold">{balance?.balance ?? 0}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                本地后端未启动时额度会显示为 0；后端可用后会自动读取真实账户余额。
              </p>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link href="/create">继续创作</Link>
            </Button>
          </div>

          <div className="studio-surface rounded-lg p-5">
            <div className="text-lg font-semibold">账号安全</div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 p-3">
                <span>密码登录</span>
                <span className="text-meter-green">已启用</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 p-3">
                <span>内容合规提醒</span>
                <span className="text-meter-green">已启用</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-panel-border bg-black/20 p-3">
                <span>商用授权记录</span>
                <span>随套餐更新</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
