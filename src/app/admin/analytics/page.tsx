"use client";

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
import { demoEarnings, demoTasks, demoCampaigns } from "@/data/demo";
import { formatCurrency, formatNumber } from "@/lib/utils";

const activityData = demoEarnings.map((p, i) => ({
  date: p.date,
  revenue: Number((p.amount * 1.35).toFixed(2)),
  tasks: Math.max(12, Math.round(p.amount * 8 + i * 3)),
}));

const categoryData = demoTasks.reduce<Array<{ category: string; completions: number }>>(
  (acc, task) => {
    const existing = acc.find((a) => a.category === task.category);
    if (existing) existing.completions += task.completions;
    else acc.push({ category: task.category, completions: task.completions });
    return acc;
  },
  [],
);

export default function AdminAnalyticsPage() {
  const revenue = activityData.reduce((s, d) => s + d.revenue, 0);
  const taskVolume = activityData.reduce((s, d) => s + d.tasks, 0);
  const campaignSpend = demoCampaigns.reduce((s, c) => s + c.spentCredits, 0);

  return (
    <DashboardShell role="admin" title="Analytics">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="14-day revenue" value={formatCurrency(revenue)} tone="mint" />
          <StatCard label="Task actions" value={formatNumber(taskVolume)} tone="coin" />
          <StatCard
            label="Campaign credits spent"
            value={formatNumber(campaignSpend)}
            tone="sky"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
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
