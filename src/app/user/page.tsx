"use client";

import Link from "next/link";
import { Flame, Target, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { demoEarnings, demoTasks } from "@/data/demo";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber, relativeTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { tasksService } from "@/services/tasks.service";
import type { TaskSubmission } from "@/types";

const statusTone = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
} as const;

export default function UserOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);

  useEffect(() => {
    if (!user) return;
    void tasksService.listSubmissions(user.uid).then((res) => {
      if (res.ok) setSubmissions(res.data.slice(0, 5));
    });
  }, [user]);

  const taskTitle = (taskId: string) =>
    demoTasks.find((t) => t.id === taskId)?.title ?? taskId;

  return (
    <DashboardShell role="user" title="Overview">
      <div className="space-y-6 animate-rise">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Available balance"
            value={formatCurrency(user?.wallet.balance ?? 0)}
            hint={`${formatCurrency(user?.wallet.pendingBalance ?? 0)} pending`}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            label="Lifetime earnings"
            value={formatCurrency(user?.wallet.lifetimeEarnings ?? 0)}
            hint={`${formatNumber(user?.gamification.xp ?? 0)} XP · Lvl ${user?.gamification.level ?? 1}`}
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            label="Streak"
            value={`${user?.gamification.streakDays ?? 0} days`}
            hint={`Best ${user?.gamification.longestStreak ?? 0} days`}
            icon={<Flame className="h-5 w-5" />}
          />
          <StatCard
            label="Referral code"
            value={user?.referralCode ?? "—"}
            hint="Share & earn"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EarningsChart data={demoEarnings} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { href: "/user/tasks", label: "Browse open tasks" },
                { href: "/user/withdraw", label: "Request withdrawal" },
                { href: "/user/challenges", label: "Join live challenges" },
                { href: "/user/marketplace", label: "Explore marketplace" },
                { href: "/user/referrals", label: "Invite friends" },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="secondary" className="w-full justify-start">
                    {link.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent submissions</CardTitle>
            <Link href="/user/tasks" className="text-sm text-teal-300 hover:underline">
              View tasks
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-sm text-slate-400">No submissions yet.</p>
            ) : (
              submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {taskTitle(sub.taskId)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {relativeTime(sub.submittedAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone[sub.status]}>{sub.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
