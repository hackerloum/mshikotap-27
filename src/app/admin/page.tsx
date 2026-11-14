"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Target, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { adminService, type AdminStats } from "@/services/admin.service";
import { tasksService } from "@/services/tasks.service";
import { walletService } from "@/services/wallet.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { TaskSubmission, Withdrawal } from "@/types";

export default function AdminOverviewPage() {
  const [pendingSubs, setPendingSubs] = useState<TaskSubmission[]>([]);
  const [pendingWd, setPendingWd] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    void Promise.all([
      tasksService.listAllSubmissions(),
      walletService.listAllWithdrawals(),
      adminService.stats(),
    ]).then(([subs, wds, st]) => {
      if (st.ok) setStats(st.data);
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

  const volume = (stats?.series ?? []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardShell role="admin" title="Overview">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Platform users"
            value={formatNumber(stats?.users ?? 0)}
            hint="Signed in with Google"
            icon={<Users className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="14-day payouts earned"
            value={formatCurrency(volume)}
            hint="Quest and bonus rewards"
            icon={<Wallet className="h-5 w-5" />}
            tone="mint"
          />
          <StatCard
            label="Pending reviews"
            value={formatNumber(pendingSubs.length)}
            icon={<Target className="h-5 w-5" />}
            tone="flame"
          />
          <StatCard
            label="Pending payouts"
            value={formatNumber(pendingWd.length)}
            icon={<Flag className="h-5 w-5" />}
            tone="coin"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Pending task reviews</CardTitle>
              <Link href="/admin/tasks">
                <Button size="sm" variant="secondary" className="min-h-11">
                  Open queue
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingSubs.length === 0 ? (
                <p className="text-sm text-slate-400">Nothing to review.</p>
              ) : (
                pendingSubs.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm font-bold text-white">{s.taskTitle ?? s.id} · {s.userName ?? ""}</span>
                    <Badge tone="warning">{s.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Pending withdrawals</CardTitle>
              <Link href="/admin/withdrawals">
                <Button size="sm" variant="secondary" className="min-h-11">
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
                    className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm font-bold text-white">
                      {formatCurrency(w.amount)} · {w.destination}
                    </span>
                    <Badge tone="warning">{w.status.replaceAll("_", " ")}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardShell>
  );
}
