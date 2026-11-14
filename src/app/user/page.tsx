"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  ChevronRight,
  Gift,
  Rocket,
  Store,
  Swords,
  Target,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin, Flame, Star } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat";
import { earningsService } from "@/services/admin.service";
import { tasksService } from "@/services/tasks.service";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import { cn, formatCurrency, formatNumber, relativeTime, xpForLevel } from "@/lib/utils";
import type { EarningsPoint, Task, TaskSubmission } from "@/types";

const COOLDOWN_MS = 20 * 60 * 60 * 1000;

const statusTone = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
} as const;

const tiles = [
  { href: "/user/tasks", label: "Quests", hint: "Earn coins", icon: Target, tone: "bg-coin/10 text-coin" },
  { href: "/user/challenges", label: "Races", hint: "Win prizes", icon: Swords, tone: "bg-sky/10 text-sky" },
  { href: "/user/withdraw", label: "Wallet", hint: "Cash out", icon: Wallet, tone: "bg-mint/10 text-mint" },
  { href: "/user/referrals", label: "Squad", hint: "Invite friends", icon: Users, tone: "bg-coral/10 text-coral" },
  { href: "/user/marketplace", label: "Market", hint: "Gigs & deals", icon: Store, tone: "bg-flame/10 text-flame" },
  { href: "/leaderboards", label: "Ranks", hint: "Top players", icon: Trophy, tone: "bg-coin/10 text-coin" },
  { href: "/pricing", label: "Boosts", hint: "Earn faster", icon: Rocket, tone: "bg-sky/10 text-sky" },
  { href: "/user/notifications", label: "Alerts", hint: "What's new", icon: Bell, tone: "bg-mint/10 text-mint" },
];

function remaining(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function UserOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const config = useConfigStore((c) => c.config);
  const claimDaily = useAuthStore((s) => s.claimDaily);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [quests, setQuests] = useState<Task[]>([]);
  const [earnings, setEarnings] = useState<EarningsPoint[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const uid = user?.uid;
  const balance = user?.wallet.balance;

  useEffect(() => {
    if (!uid) return;
    void tasksService.listSubmissions().then((res) => {
      if (res.ok) setSubmissions(res.data.slice(0, 4));
    });
    void tasksService.list().then((res) => {
      if (res.ok) setQuests(res.data.slice(0, 4));
    });
    void earningsService.mine().then((res) => {
      if (res.ok) setEarnings(res.data);
    });
  }, [uid, balance]);

  if (!user) return <DashboardShell role="user" title="Home">{null}</DashboardShell>;

  const { gamification, wallet } = user;
  const level = gamification.level;
  const floor = level > 1 ? xpForLevel(level) : 0;
  const ceiling = xpForLevel(level + 1);
  const intoLevel = Math.max(0, gamification.xp - floor);
  const span = Math.max(1, ceiling - floor);

  const lastClaim = gamification.lastDailyClaimAt
    ? new Date(gamification.lastDailyClaimAt).getTime()
    : 0;
  const wait = lastClaim ? lastClaim + COOLDOWN_MS - now : 0;
  const canClaim = wait <= 0;
  const nextReward = config.dailyBonusBase + Math.min(gamification.streakDays + 1, 7) * config.dailyBonusStep;
  const firstName = user.displayName.split(" ")[0];
  const streakDays = Math.min(gamification.streakDays, 7);

  async function onClaim() {
    setClaiming(true);
    const res = await claimDaily();
    setClaiming(false);
    if (res.ok) {
      toast.success(`+${formatCurrency(res.reward ?? 0)} and +${res.xpGain ?? 0} XP`, {
        description: res.levelUp ? "Level up. Nice work." : "Streak kept alive.",
      });
    } else {
      toast.error(res.message || "Could not claim right now");
    }
  }

  return (
    <DashboardShell role="user" title="Home">
      <div className="space-y-5">
        <section className="grid-bg rounded-xl border border-ink-700/80 bg-ink-900 p-5">
          <p className="text-sm font-medium text-slate-400">Welcome back, {firstName}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-sky/10 text-sky">
                <Star size={28} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Current level
                </p>
                <p className="tabular font-display text-3xl leading-none text-white">Level {level}</p>
              </div>
            </div>
            <Link href="/user/tasks" className={buttonVariants({ size: "default" })}>
              Browse quests <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Progress to level {level + 1}</span>
              <span className="tabular">
                {formatNumber(intoLevel)} / {formatNumber(span)} XP
              </span>
            </div>
            <ProgressBar
              value={intoLevel}
              max={span}
              tone="sky"
              label={`Progress to level ${level + 1}`}
            />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-flame/10 text-flame">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-xl text-white">Daily reward</h2>
                <p className="text-sm text-slate-400">
                  {canClaim
                    ? `Claim ${formatCurrency(nextReward)} and keep your streak`
                    : `Next reward in ${remaining(wait)}`}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>Streak</span>
                <span className="tabular">{streakDays} / 7 days</span>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "tabular grid h-8 flex-1 place-items-center rounded-md text-xs font-semibold",
                      i < streakDays
                        ? "bg-flame/15 text-flame"
                        : "bg-ink-800 text-slate-500",
                    )}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant={canClaim ? "mint" : "secondary"}
              size="lg"
              className="mt-4 w-full"
              disabled={!canClaim || claiming}
              onClick={onClaim}
            >
              {claiming ? "Claiming…" : canClaim ? "Claim daily reward" : "Come back later"}
            </Button>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Balance" value={formatCurrency(wallet.balance)} icon={<Coin size={22} />} tone="coin" />
            <StatCard label="Streak" value={`${gamification.streakDays} days`} icon={<Flame size={22} />} tone="flame" />
            <StatCard label="Total earned" value={formatCurrency(wallet.lifetimeEarnings)} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} tone="mint" />
            <StatCard label="Pending" value={formatCurrency(wallet.pendingBalance)} icon={<Target className="h-5 w-5" aria-hidden="true" />} tone="sky" />
          </div>
        </div>

        <section>
          <h2 className="mb-3 font-display text-xl text-white">Quick links</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="group flex flex-col gap-3 rounded-xl border border-ink-700/80 bg-ink-900 p-4 shadow-sm shadow-black/20 transition-colors hover:border-ink-600 hover:bg-ink-800"
                >
                  <span className={cn("grid h-11 w-11 place-items-center rounded-lg", tile.tone)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-display text-base leading-tight text-white">{tile.label}</span>
                    <span className="text-xs text-slate-400">{tile.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-white">Quests for you</h2>
            <Link href="/user/tasks" className="text-sm font-semibold text-coin hover:underline">
              See all
            </Link>
          </div>
          {quests.length === 0 ? (
            <EmptyState
              title="No open quests right now"
              description="New quests are added every day. Claim your daily reward and check back soon."
            />
          ) : null}
          <div className="space-y-3">
            {quests.map((task) => (
              <Link
                key={task.id}
                href="/user/tasks"
                className="flex items-center gap-3 rounded-xl border border-ink-700/80 bg-ink-900 p-4 shadow-sm shadow-black/20 transition-colors hover:border-ink-600 hover:bg-ink-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{task.title}</p>
                  <p className="tabular text-xs font-medium text-sky">+{task.xpReward} XP</p>
                </div>
                <Badge tone="brand" className="gap-1.5 px-2.5 py-1 text-xs normal-case">
                  <Coin size={14} />
                  <span className="tabular">{formatCurrency(task.reward)}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EarningsChart data={earnings} />
          </div>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink-600 p-4 text-center text-sm text-slate-400">
                  Nothing yet. Finish a quest and it shows up here.
                </p>
              ) : (
                submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{s.taskTitle ?? "Quest"}</p>
                      <p className="text-xs text-slate-400">{relativeTime(s.submittedAt)}</p>
                    </div>
                    <Badge tone={statusTone[s.status]}>{s.status}</Badge>
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
