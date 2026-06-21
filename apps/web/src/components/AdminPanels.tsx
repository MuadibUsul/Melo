"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { AdminTable } from "@/components/AdminTable";

interface Paged<T> {
  items: T[];
  total: number;
}

interface ModerationCase {
  id: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  status: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  displayName: string;
  email?: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface AdminSubscription {
  id: string;
  status: string;
  provider: string;
  currentPeriodEnd: string;
  user?: { displayName: string; email?: string | null };
  plan?: { name: string; priceCents: number; interval: string } | null;
}

interface CostRow {
  model: string;
  type: string;
  status: string;
  calls: number;
  creditCost: number;
  estimatedCostCents: number;
}

interface CostSummary {
  totalJobs: number;
  succeededJobs: number;
  failedJobs: number;
  successRate: number;
  failedRate: number;
  estimatedCostCents: number;
  rows: CostRow[];
}

function EmptyState({ message }: { message: string }) {
  return <div className="studio-surface rounded-lg p-5 text-sm text-muted-foreground">{message}</div>;
}

export function AdminContentPanel() {
  const queryClient = useQueryClient();
  const { data, isError } = useQuery({
    queryKey: ["admin", "moderation"],
    queryFn: () => api.get<Paged<ModerationCase>>("/admin/moderation"),
    retry: 0,
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      api.post(`/admin/moderation/${id}/review`, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
      toast("\u5df2\u66f4\u65b0", "success");
    },
    onError: (error) => toast(error instanceof Error ? error.message : "\u64cd\u4f5c\u5931\u8d25", "error"),
  });

  if (isError) return <EmptyState message="\u8bf7\u4f7f\u7528\u7ba1\u7406\u5458\u8d26\u53f7\u767b\u5f55\u3002" />;
  const items = data?.items ?? [];
  return (
    <AdminTable
      columns={["\u5bf9\u8c61", "\u539f\u56e0", "\u72b6\u6001", "\u63d0\u4ea4\u65f6\u95f4", "\u64cd\u4f5c"]}
      rows={items.map((item) => [
        <Link
          key="target"
          href={item.targetType === "track" ? `/tracks/${item.targetId}` : "#"}
          className="text-studio-gold"
        >
          {item.targetType}:{item.targetId.slice(0, 8)}
        </Link>,
        item.reason ?? "-",
        <Badge key="status" variant="outline">
          {item.status}
        </Badge>,
        new Date(item.createdAt).toLocaleString(),
        <div key="actions" className="flex gap-2">
          <Button size="sm" onClick={() => review.mutate({ id: item.id, decision: "approved" })}>
            {"\u901a\u8fc7"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => review.mutate({ id: item.id, decision: "rejected" })}>
            {"\u9a73\u56de"}
          </Button>
        </div>,
      ])}
    />
  );
}

export function AdminUsersPanel() {
  const { data, isError } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<Paged<AdminUser>>("/admin/users"),
    retry: 0,
  });
  if (isError) return <EmptyState message="\u8bf7\u4f7f\u7528\u7ba1\u7406\u5458\u8d26\u53f7\u767b\u5f55\u3002" />;
  return (
    <AdminTable
      columns={["\u7528\u6237", "\u90ae\u7bb1", "\u89d2\u8272", "\u72b6\u6001", "\u6ce8\u518c\u65f6\u95f4"]}
      rows={(data?.items ?? []).map((user) => [
        user.displayName,
        user.email ?? "-",
        <Badge key="role" variant="secondary">
          {user.role}
        </Badge>,
        <Badge key="status" variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
          {user.status}
        </Badge>,
        new Date(user.createdAt).toLocaleString(),
      ])}
    />
  );
}

export function AdminBillingPanel() {
  const { data, isError } = useQuery({
    queryKey: ["admin", "billing"],
    queryFn: () => api.get<Paged<AdminSubscription>>("/admin/billing"),
    retry: 0,
  });
  if (isError) return <EmptyState message="\u8bf7\u4f7f\u7528\u7ba1\u7406\u5458\u8d26\u53f7\u767b\u5f55\u3002" />;
  return (
    <AdminTable
      columns={["\u7528\u6237", "\u5957\u9910", "\u91d1\u989d", "\u6e20\u9053", "\u72b6\u6001", "\u5230\u671f"]}
      rows={(data?.items ?? []).map((sub) => [
        sub.user?.displayName ?? "-",
        sub.plan?.name ?? "-",
        sub.plan ? `¥${Math.round(sub.plan.priceCents / 100)}` : "-",
        sub.provider,
        <Badge key="status" variant="secondary">
          {sub.status}
        </Badge>,
        new Date(sub.currentPeriodEnd).toLocaleDateString(),
      ])}
    />
  );
}

export function AdminCostsPanel() {
  const { data, isError } = useQuery({
    queryKey: ["admin", "costs"],
    queryFn: () => api.get<CostSummary>("/admin/costs"),
    retry: 0,
  });
  if (isError) return <EmptyState message="\u8bf7\u4f7f\u7528\u7ba1\u7406\u5458\u8d26\u53f7\u767b\u5f55\u3002" />;
  const summary = data ?? {
    totalJobs: 0,
    succeededJobs: 0,
    failedJobs: 0,
    successRate: 0,
    failedRate: 0,
    estimatedCostCents: 0,
    rows: [],
  };
  return (
    <>
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {[
          ["\u603b\u8c03\u7528", summary.totalJobs.toLocaleString()],
          ["\u6210\u529f\u7387", `${summary.successRate}%`],
          ["\u5931\u8d25\u7387", `${summary.failedRate}%`],
          ["\u9884\u4f30\u6210\u672c", `¥${(summary.estimatedCostCents / 100).toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="studio-surface rounded-lg p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <AdminTable
        columns={["\u6a21\u578b", "\u7c7b\u578b", "\u72b6\u6001", "\u8c03\u7528", "\u989d\u5ea6", "\u6210\u672c"]}
        rows={summary.rows.map((row) => [
          row.model,
          row.type,
          <Badge key="status" variant="outline">
            {row.status}
          </Badge>,
          row.calls.toLocaleString(),
          row.creditCost.toLocaleString(),
          `¥${(row.estimatedCostCents / 100).toFixed(2)}`,
        ])}
      />
    </>
  );
}
