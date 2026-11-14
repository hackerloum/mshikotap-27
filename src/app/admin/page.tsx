"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ClipboardCheck, Coins, Flag, ShieldAlert, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { PlayerChip, Toggle, dateTime } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import {
  adminService,
  type AdminFlag,
  type AdminStats,
  type AdminSubmission,
  type AdminWithdrawal,
  type AuditRow,
} from "@/services/admin.service";
import { flagLabels } from "@/config/system";
import { formatCurrency, formatNumber, relativeTime } from "@/lib/utils";

type Switches = AdminStats["switches"];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reviews, setReviews] = useState<AdminSubmission[]>([]);
  const [payouts, setPayouts] = useState<AdminWithdrawal[]>([]);
  const [flags, setFlags] = useState<AdminFlag[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [st, subs, wds, fl, log] = await Promise.all([
      adminService.stats(),
      adminService.submissions("submitted"),
      adminService.withdrawals(),
      adminService.flags("open"),
      adminService.audit(),
    ]);
    if (st.ok) setStats(st.data);
    if (subs.ok) setReviews(subs.data);
    if (wds.ok) setPayouts(wds.data.filter((w) => w.status === "pending" || w.status === "under_review"));
    if (fl.ok) setFlags(fl.data);
    if (log.ok) setAudit(log.data.slice(0, 6));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function flip(key: keyof Switches, value: boolean) {
    setSaving(true);
    const res = await adminService.saveSettings({ [key]: value });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Updated");
    void load();
  }

  const earned = (stats?.series ?? []).reduce((sum, p) => sum + p.amount, 0);
  const sw = stats?.switches;

  return (
    <DashboardShell role="admin" title="Control room">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Players"
            value={formatNumber(stats?.users ?? 0)}
            hint={`${stats?.bannedUsers ?? 0} suspended`}
            icon={<Users className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="Quests to review"
            value={formatNumber(stats?.pendingReviews ?? reviews.length)}
            icon={<ClipboardCheck className="h-5 w-5" />}
            tone="flame"
          />
          <StatCard
            label="Payout queue"
            value={formatCurrency(stats?.payoutQueueAmount ?? 0)}
            hint={`${stats?.pendingPayouts ?? payouts.length} waiting for review`}
            icon={<Wallet className="h-5 w-5" />}
            tone="coin"
          />
          <StatCard
            label="Open fraud alerts"
            value={formatNumber(stats?.fraudOpen ?? 0)}
            icon={<ShieldAlert className="h-5 w-5" />}
            tone="coral"
          />
          <StatCard
            label="Owed to players"
            value={formatCurrency(stats?.walletLiability ?? 0)}
            hint="Total of all wallet balances"
            icon={<Coins className="h-5 w-5" />}
            tone="mint"
          />
          <StatCard
            label="Rewards on hold"
            value={formatCurrency(stats?.pendingRewards ?? 0)}
            hint="Waiting for quest approval"
            icon={<ClipboardCheck className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="Paid out, 14 days"
            value={formatCurrency(earned)}
            hint="Quest and bonus rewards"
            icon={<Wallet className="h-5 w-5" />}
            tone="mint"
          />
          <StatCard
            label="Campaign spend"
            value={formatCurrency(stats?.campaignSpend ?? 0)}
            icon={<Flag className="h-5 w-5" />}
            tone="flame"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Kill switches</CardTitle>
            <Link href="/admin/settings">
              <Button size="sm" variant="secondary" className="min-h-11">
                All settings
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Toggle
              label="New sign-ups"
              hint="Off blocks new accounts"
              checked={sw?.signupsOpen ?? true}
              disabled={!sw || saving}
              onChange={(v) => void flip("signupsOpen", v)}
            />
            <Toggle
              label="Quests"
              hint="Off pauses starting and sending quests"
              checked={sw?.questsOpen ?? true}
              disabled={!sw || saving}
              onChange={(v) => void flip("questsOpen", v)}
            />
            <Toggle
              label="Cash outs"
              hint="Off pauses new payout requests"
              checked={sw?.withdrawalsOpen ?? true}
              disabled={!sw || saving}
              onChange={(v) => void flip("withdrawalsOpen", v)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <EarningsChart data={stats?.series ?? []} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Fraud alerts</CardTitle>
              <Link href="/admin/fraud">
                <Button size="sm" variant="secondary" className="min-h-11">
                  Open
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {flags.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No open alerts. All quiet.</p>
              ) : (
                flags.slice(0, 5).map((f) => (
                  <div key={f.id} className="rounded-2xl border-2 border-ink-700 bg-ink-800 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-white">{flagLabels[f.kind] ?? f.kind}</p>
                      <Badge tone={f.severity === "high" ? "danger" : f.severity === "medium" ? "warning" : "default"}>
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {f.player?.name ?? f.userId} · {relativeTime(f.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Oldest quests waiting</CardTitle>
              <Link href="/admin/reviews">
                <Button size="sm" variant="secondary" className="min-h-11">
                  Review queue
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {reviews.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">Nothing to review.</p>
              ) : (
                reviews.slice(0, 5).map((s) => (
                  <div key={s.id} className="rounded-2xl border-2 border-ink-700 bg-ink-800 p-3">
                    <p className="truncate text-sm font-extrabold text-white">
                      {s.taskTitle ?? s.taskId} · {formatCurrency(s.reward ?? 0)}
                    </p>
                    <div className="mt-1">
                      <PlayerChip player={s.player} fallback={s.userName} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Payouts waiting</CardTitle>
              <Link href="/admin/withdrawals">
                <Button size="sm" variant="secondary" className="min-h-11">
                  Payout queue
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {payouts.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No payouts waiting.</p>
              ) : (
                payouts.slice(0, 5).map((w) => (
                  <div key={w.id} className="rounded-2xl border-2 border-ink-700 bg-ink-800 p-3">
                    <p className="truncate text-sm font-extrabold text-white">
                      {formatCurrency(w.amount)} · {w.destination}
                    </p>
                    <div className="mt-1">
                      <PlayerChip player={w.player} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Latest admin activity</CardTitle>
            <Link href="/admin/audit">
              <Button size="sm" variant="secondary" className="min-h-11">
                Audit log
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {audit.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">No admin actions recorded yet.</p>
            ) : (
              audit.map((a) => (
                <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5">
                  <p className="min-w-0 break-words text-sm font-bold text-slate-200">
                    <span className="text-coin">{a.actorName}</span> · {a.summary}
                  </p>
                  <span className="text-xs font-semibold text-slate-500">{dateTime(a.createdAt)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
