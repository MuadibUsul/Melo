"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
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
    features: { proMode: false, commercial: false },
  },
  {
    code: "monthly",
    name: "专业版月付",
    priceCents: 3900,
    currency: "CNY",
    interval: "month",
    monthlyCredits: 2000,
    features: { proMode: true, commercial: true },
  },
  {
    code: "yearly",
    name: "专业版年付",
    priceCents: 39900,
    currency: "CNY",
    interval: "year",
    monthlyCredits: 3000,
    features: { proMode: true, commercial: true, priorityQueue: true },
  },
];

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
      toast(error instanceof Error ? error.message : "订阅创建失败", "error");
    },
  });

  const plans = data?.length ? data : fallbackPlans;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <div key={plan.code} className="studio-surface rounded-lg p-5">
          <div className="text-sm text-studio-gold">{plan.name}</div>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-3xl font-semibold">{`¥${Math.round(plan.priceCents / 100)}`}</span>
            <span className="pb-1 text-sm text-muted-foreground">
              {plan.interval === "year" ? "/年" : plan.interval === "month" ? "/月" : ""}
            </span>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">每月 {plan.monthlyCredits.toLocaleString()} 额度</div>
          <div className="mt-5 space-y-2 text-sm">
            {[
              plan.features.proMode ? "专业工作台" : "简易创作",
              plan.features.commercial ? "商用授权" : "个人使用",
              plan.features.priorityQueue ? "优先队列" : "标准队列",
            ].map((item) => (
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
      ))}
    </div>
  );
}
