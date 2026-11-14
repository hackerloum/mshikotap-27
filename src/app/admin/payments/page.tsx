"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleDollarSign, Crown, Landmark, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { adminService, type PaymentsOverview } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";

const tone = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  expired: "default",
  voided: "default",
  mismatch: "danger",
} as const;

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsOverview | null>(null);

  useEffect(() => {
    void adminService.payments().then((res) => {
      if (res.ok) setData(res.data);
      else toast.error(res.error.message);
    });
  }, []);

  if (!data) {
    return (
      <DashboardShell role="admin" title="Money">
        <Loading />
      </DashboardShell>
    );
  }

  const { summary: s, items } = data;

  return (
    <DashboardShell role="admin" title="Money">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Money in, all time" value={formatCurrency(s.moneyIn)} hint={`${formatCurrency(s.moneyIn30d)} in the last 30 days`} icon={<CircleDollarSign className="h-5 w-5" />} tone="mint" />
          <StatCard label="Advertiser top-ups" value={formatCurrency(s.topups)} hint="Funds quests" icon={<Landmark className="h-5 w-5" />} tone="sky" />
          <StatCard label="Premium sales" value={formatCurrency(s.premium)} hint={`${s.premiumSales} sold`} icon={<Crown className="h-5 w-5" />} tone="coin" />
          <StatCard label="Margin from quests" value={formatCurrency(s.campaignMargin)} hint="Your share of used advertiser money" icon={<TrendingUp className="h-5 w-5" />} tone="flame" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Held for advertisers" value={formatCurrency(s.advertiserBalances)} hint="Unspent advertiser balances" tone="coral" />
          <StatCard label="Waiting to be paid" value={String(s.pending)} hint="Open checkouts" tone="coin" />
          <StatCard label="Needs a look" value={String(s.mismatches)} hint="Wrong amount paid" tone="coral" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Latest payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">No payments yet. They appear here as soon as someone checks out.</p>
            ) : (
              items.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ink-800 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg text-white">
                      {formatCurrency(p.amount)} · {p.kind === "premium" ? "Premium" : "Top-up"}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {p.email ?? p.uid} · {relativeTime(p.createdAt)}
                    </p>
                  </div>
                  <Badge tone={tone[p.status]}>{p.status === "completed" ? "paid" : p.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
