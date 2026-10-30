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
      <div className="space-y-6 animate-rise">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Completions" value={formatNumber(totals.completions)} />
          <StatCard label="Credits spent" value={formatNumber(totals.spent)} />
          <StatCard label="Budget" value={formatNumber(totals.budget)} />
          <StatCard label="Avg CPA" value={formatNumber(totals.cpa)} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400">No campaign data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1524",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="completions" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="spent" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
