"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Target, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { demoUser, demoAdvertiser, demoEarnings } from "@/data/demo";
import { tasksService } from "@/services/tasks.service";
import { walletService } from "@/services/wallet.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { TaskSubmission, Withdrawal } from "@/types";

export default function AdminOverviewPage() {
  const [pendingSubs, setPendingSubs] = useState<TaskSubmission[]>([]);
  const [pendingWd, setPendingWd] = useState<Withdrawal[]>([]);

  useEffect(() => {
    void Promise.all([
      tasksService.listSubmissions(),
      walletService.listWithdrawals(),
    ]).then(([subs, wds]) => {
      if (subs.ok) {
        setPendingSubs(subs.data.filter((s) => s.status === "submitted"));
      }
      if (wds.ok) {
        setPendingWd(
          wds.data.filter(
            (w) => w.status === "pending" || w.status === "under_review",
          ),
        );
      }
    });
  }, []);

  const revenue = demoEarnings.reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardShell role="admin" title="Overview">
      <div className="space-y-6 animate-rise">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Platform users"
            value={formatNumber(12840)}
            hint="Demo KPI"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="14d activity $"
            value={formatCurrency(revenue)}
            hint="Task + fee volume"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            label="Pending reviews"
            value={formatNumber(pendingSubs.length)}
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            label="Pending payouts"
            value={formatNumber(pendingWd.length)}
            icon={<Flag className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending task reviews</CardTitle>
              <Link href="/admin/tasks">
                <Button size="sm" variant="secondary">
                  Open queue
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingSubs.length === 0 ? (
                <p className="text-sm text-slate-400">Queue clear.</p>
              ) : (
                pendingSubs.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2"
                  >
                    <span className="text-sm text-white">{s.id}</span>
                    <Badge tone="warning">{s.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending withdrawals</CardTitle>
              <Link href="/admin/withdrawals">
                <Button size="sm" variant="secondary">
                  Open queue
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingWd.length === 0 ? (
                <p className="text-sm text-slate-400">No payouts waiting.</p>
              ) : (
                pendingWd.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2"
                  >
                    <span className="text-sm text-white">
                      {formatCurrency(w.amount)} · {w.destination}
                    </span>
                    <Badge tone="info">{w.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demo accounts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm text-slate-300">
            <Badge>{demoUser.email}</Badge>
            <Badge tone="info">{demoAdvertiser.email}</Badge>
            <Badge tone="brand">admin@mshikotap.com</Badge>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
