"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
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
import { adminService, type AdminStats } from "@/services/admin.service";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    void adminService.stats().then((res) => {
      if (res.ok) setStats(res.data);
    });
  }, []);

  const activityData = (stats?.series ?? []).map((p) => ({ date: p.date, revenue: p.amount }));
  const categoryData = stats?.categories ?? [];
  const revenue = activityData.reduce((s, d) => s + d.revenue, 0);
  const taskVolume = categoryData.reduce((s, c) => s + c.completions, 0);
  const campaignSpend = stats?.campaignSpend ?? 0;

  return (
    <DashboardShell role="admin" title="Analytics">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="14-day rewards paid" value={formatCurrency(revenue)} tone="mint" />
          <StatCard label="Quests completed" value={formatNumber(taskVolume)} tone="coin" />
          <StatCard
            label="Campaign credits spent"
            value={formatCurrency(campaignSpend)}
            tone="sky"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rewards earned per day</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <CartesianGrid stroke="#2a3070" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8d93c4", fontSize: 11 }}
                  tickFormatter={(v) => String(v).slice(5)}
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
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffc21a"
                  fill="#ffc21a"
                  fillOpacity={0.18}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completions by category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid stroke="#2a3070" vertical={false} />
                <XAxis
                  dataKey="category"
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
                />
                <Bar
                  dataKey="completions"
                  fill="#34d17d"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
