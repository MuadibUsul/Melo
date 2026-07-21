"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, CircleDollarSign, Clock3, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";

interface PlanView {
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  monthlyCredits: number;
  features: Record<string, unknown>;
}

const fallbackPlans: PlanView[] = [
  {
    code: "free",
    name: "免费版",
    priceCents: 0,
    currency: "CNY",
    interval: "none",
    monthlyCredits: 120,
    features: { proMode: false, commercial: false, priorityQueue: false, downloads: "标准音频" },
  },
  {
    code: "monthly",
    name: "专业版月付",
    priceCents: 3900,
    currency: "CNY",
    interval: "month",
    monthlyCredits: 2000,
    features: { proMode: true, commercial: true, priorityQueue: false, downloads: "高清音频" },
  },
  {
    code: "yearly",
    name: "专业版年付",
    priceCents: 39900,
    currency: "CNY",
    interval: "year",
    monthlyCredits: 3000,
    features: { proMode: true, commercial: true, priorityQueue: true, downloads: "高清音频与分轨" },
  },
];

const faqItems = [
  ["额度会在什么时候刷新？", "订阅额度按月刷新，未登录时会先展示本地套餐说明。"],
  ["能否商用生成的歌曲？", "免费版仅适合个人体验，专业版包含公开发布和商业使用授权。"],
  ["专业版包含哪些高级能力？", "高级创作、参考音频、声音人设、编辑器、延展和 Remix 工作流。"],
];

function formatPrice(plan: PlanView) {
  if (plan.priceCents === 0) return "¥0";
  return `¥${Math.round(plan.priceCents / 100)}`;
}

function formatInterval(interval: string) {
  if (interval === "year") return "/年";
  if (interval === "month") return "/月";
  return "";
}

function planFeatures(plan: PlanView) {
  return [
    `${plan.monthlyCredits.toLocaleString()} 月度创作额度`,
    plan.features.proMode ? "高级创作与结构化歌词" : "快速创作体验",
    plan.features.commercial ? "商用授权" : "个人使用",
    plan.features.priorityQueue ? "优先生成队列" : "标准生成队列",
    typeof plan.features.downloads === "string" ? plan.features.downloads : "音频下载",
  ];
}

export function PricingPlans() {
  const { data } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.get<PlanView[]>("/plans"),
    retry: 0,
  });

  const createSubscription = useMutation({
    mutationFn: (planCode: string) =>
      api.post<{ subscriptionId: string; checkoutUrl?: string | null }>("/subscription/create", {
        planCode,
        provider: "web",
      }),
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      toast("订阅已生效，额度已发放", "success");
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "请登录后继续选择套餐", "info");
    },
  });

  const plans = data?.length ? data : fallbackPlans;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const highlighted = plan.code === "monthly" || plan.code === "yearly";
          return (
            <div
              key={plan.code}
              className={`studio-surface rounded-lg p-5 ${highlighted ? "border-studio-gold/45 bg-studio-gold/5" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-studio-gold">{plan.name}</div>
                {highlighted ? <Crown className="size-4 text-studio-gold" /> : <Sparkles className="size-4 text-muted-foreground" />}
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-semibold">{formatPrice(plan)}</span>
                <span className="pb-1 text-sm text-muted-foreground">{formatInterval(plan.interval)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CircleDollarSign className="size-4 text-studio-gold" />
                每月 {plan.monthlyCredits.toLocaleString()} 额度
              </div>
              <div className="mt-5 space-y-2 text-sm">
                {planFeatures(plan).map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-studio-gold" />
                    {item}
                  </div>
                ))}
              </div>
              <Button
                className="mt-5 w-full"
                onClick={() => createSubscription.mutate(plan.code)}
                disabled={createSubscription.isPending}
              >
                {plan.priceCents === 0 ? "启用免费额度" : "选择套餐"}
              </Button>
            </div>
          );
        })}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="studio-surface rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Clock3 className="size-5 text-meter-green" />
            适合哪些工作流
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {["一句话快速生成", "上传参考音频", "歌曲编辑器与分轨导出", "公开发布与商业使用"].map((item) => (
              <div key={item} className="rounded-lg border border-panel-border bg-black/20 px-3 py-2">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="studio-surface rounded-lg p-5">
          <div className="mb-4 text-lg font-semibold">常见问题</div>
          <div className="space-y-3">
            {faqItems.map(([question, answer]) => (
              <div key={question} className="rounded-lg border border-panel-border bg-black/20 p-3">
                <div className="text-sm font-medium">{question}</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">{answer}</div>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/account">查看账号与额度</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
