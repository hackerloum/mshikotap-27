"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { campaignsService } from "@/services/campaigns.service";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/lib/utils";
import type { Campaign } from "@/types";

export default function AdvertiserAnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!user) return;
    void campaignsService.list(user.uid).then((res) => {
      if (res.ok) setCampaigns(res.data);
    });
  }, [user]);

  const chartData = useMemo(
    () =>
      campaigns.map((c) => ({
        name: c.title.length > 18 ? `${c.title.slice(0, 18)}…` : c.title,
        completions: c.completions,
        spent: c.spentCredits,
        remaining: Math.max(0, c.budgetCredits - c.spentCredits),
      })),
    [campaigns],
  );

  const totals = useMemo(() => {
    const completions = campaigns.reduce((s, c) => s + c.completions, 0);
    const spent = campaigns.reduce((s, c) => s + c.spentCredits, 0);
    const budget = campaigns.reduce((s, c) => s + c.budgetCredits, 0);
    const cpa =
      completions > 0 ? Number((spent / completions).toFixed(2)) : 0;
    return { completions, spent, budget, cpa };
  }, [campaigns]);

  return (
    <DashboardShell role="advertiser" title="Analytics">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Completions" value={formatNumber(totals.completions)} tone="mint" />
          <StatCard label="Credits spent" value={formatNumber(totals.spent)} tone="coin" />
          <StatCard label="Budget" value={formatNumber(totals.budget)} tone="sky" />
          <StatCard label="Avg CPA" value={formatNumber(totals.cpa)} tone="flame" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How campaigns are doing</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#2a3070" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#8d93c4", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8d93c4", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1c2150",
                      border: "2px solid #3b4290",
                      borderRadius: 14,
                      color: "#fff",
                    }}
                    cursor={{ fill: "#2a3070", opacity: 0.4 }}
                  />
                  <Bar dataKey="completions" fill="#ffc21a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="spent" fill="#34d17d" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
