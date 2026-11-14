"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Gift,
  Rocket,
  Store,
  Swords,
  Target,
  Trophy,
  Users,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin, Flame } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { earningsService } from "@/services/admin.service";
import { tasksService } from "@/services/tasks.service";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatCurrency, formatNumber, relativeTime, xpForLevel } from "@/lib/utils";
import type { EarningsPoint, Task, TaskSubmission } from "@/types";

const COOLDOWN_MS = 20 * 60 * 60 * 1000;

const statusTone = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
} as const;

const tiles = [
  { href: "/user/tasks", label: "Quests", hint: "Earn coins", icon: Target, tone: "bg-coin" },
  { href: "/user/challenges", label: "Races", hint: "Win prizes", icon: Swords, tone: "bg-sky" },
  { href: "/user/withdraw", label: "Wallet", hint: "Cash out", icon: Wallet, tone: "bg-mint" },
  { href: "/user/referrals", label: "Squad", hint: "Invite friends", icon: Users, tone: "bg-coral" },
  { href: "/user/marketplace", label: "Market", hint: "Gigs & deals", icon: Store, tone: "bg-flame" },
  { href: "/leaderboards", label: "Ranks", hint: "Top players", icon: Trophy, tone: "bg-coin" },
  { href: "/pricing", label: "Boosts", hint: "Earn faster", icon: Rocket, tone: "bg-sky" },
  { href: "/user/notifications", label: "Alerts", hint: "What's new", icon: Bell, tone: "bg-mint" },
];

function remaining(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function UserOverviewPage() {
  const user = useAuthStore((s) => s.user);
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
  const nextReward = 100 + Math.min(gamification.streakDays + 1, 7) * 50;
  const firstName = user.displayName.split(" ")[0];


  async function onClaim() {
    setClaiming(true);
    const res = await claimDaily();
    setClaiming(false);
    if (res.ok) {
      toast.success(`+${formatCurrency(res.reward ?? 0)} and +${res.xpGain ?? 0} XP`, {
        description: res.levelUp ? "Level up! Nice work." : "Streak kept alive.",
      });
    } else {
      toast.error(res.message || "Could not claim right now");
    }
  }

  return (
    <DashboardShell role="user" title="Home">
      <div className="space-y-5">
        <section className="rounded-3xl border-2 border-ink-950 bg-sky p-5 text-ink-950 shadow-[0_6px_0_0_var(--color-sky-deep)]">
          <p className="font-extrabold">Hey {firstName}, ready to play?</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-4xl leading-none sm:text-5xl">Level {level}</p>
              <p className="mt-1 text-sm font-bold">
                {formatNumber(intoLevel)} / {formatNumber(span)} XP to level {level + 1}
              </p>
            </div>
            <Link
              href="/user/tasks"
              className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-ink-950 bg-ink-950 px-4 font-display text-white active:translate-y-0.5"
            >
              Play quests <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ink-950 bg-white/60">
            <div
              className="h-full rounded-full bg-ink-950 transition-[width] duration-700"
              style={{ width: `${Math.min(100, (intoLevel / span) * 100)}%` }}
            />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border-2 border-ink-700 bg-ink-900 p-5 shadow-[0_5px_0_0_var(--color-ink-700)]">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-flame/15">
                <Gift className="h-7 w-7 text-flame" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl text-white">Daily bonus</h2>
                <p className="text-sm font-semibold text-slate-400">
                  {canClaim
                    ? `Claim ${formatCurrency(nextReward)} and keep your streak`
                    : `Next bonus in ${remaining(wait)}`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid h-9 flex-1 place-items-center rounded-xl border-2",
                    i < Math.min(gamification.streakDays, 7)
                      ? "border-flame/60 bg-flame/15"
                      : "border-ink-700 bg-ink-800",
                  )}
                >
                  {i < Math.min(gamification.streakDays, 7) ? (
                    <Flame size={18} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-600" />
                  )}
                </span>
              ))}
            </div>
            <Button
              variant={canClaim ? "mint" : "secondary"}
              size="lg"
              className="mt-4 w-full"
              disabled={!canClaim || claiming}
              onClick={onClaim}
            >
              {claiming ? "Claiming…" : canClaim ? "Claim daily bonus" : "Come back later"}
            </Button>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Balance" value={formatCurrency(wallet.balance)} icon={<Coin size={26} />} accent="text-coin" />
            <MiniStat label="Streak" value={`${gamification.streakDays} days`} icon={<Flame size={26} />} accent="text-flame" />
            <MiniStat label="Total earned" value={formatCurrency(wallet.lifetimeEarnings)} icon={<Wallet className="h-6 w-6 text-mint" />} accent="text-mint" />
            <MiniStat label="Pending" value={formatCurrency(wallet.pendingBalance)} icon={<Target className="h-6 w-6 text-sky" />} accent="text-sky" />
          </div>
        </div>

        <section>
          <h2 className="mb-3 font-display text-2xl text-white">Jump in</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="group flex flex-col gap-3 rounded-3xl border-2 border-ink-700 bg-ink-900 p-4 shadow-[0_5px_0_0_var(--color-ink-700)] transition active:translate-y-1 active:shadow-[0_1px_0_0_var(--color-ink-700)]"
                >
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink-950 text-ink-950 transition group-hover:-rotate-6",
                      tile.tone,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-display text-xl leading-none text-white">{tile.label}</span>
                    <span className="text-xs font-bold text-slate-400">{tile.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl text-white">Quests for you</h2>
            <Link href="/user/tasks" className="text-sm font-extrabold text-coin hover:underline">
              See all
            </Link>
          </div>
          {quests.length === 0 ? (
            <EmptyState
              title="No open quests right now"
              description="New quests land every day. Claim your daily bonus and check back soon."
            />
          ) : null}
          <div className="space-y-3">
            {quests.map((task) => (
              <Link
                key={task.id}
                href="/user/tasks"
                className="flex items-center gap-3 rounded-3xl border-2 border-ink-700 bg-ink-900 p-4 shadow-[0_5px_0_0_var(--color-ink-700)] transition active:translate-y-1"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-white">{task.title}</p>
                  <p className="text-xs font-bold text-sky">+{task.xpReward} XP</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-coin px-3 py-1.5 font-display text-ink-950">
                  <Coin size={18} />
                  {formatCurrency(task.reward)}
                </span>
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
                <p className="rounded-2xl border-2 border-dashed border-ink-600 p-4 text-center text-sm font-semibold text-slate-400">
                  Nothing yet. Finish a quest and it shows up here.
                </p>
              ) : (
                submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white">{s.taskTitle ?? "Quest"}</p>
                      <p className="text-xs font-semibold text-slate-400">{relativeTime(s.submittedAt)}</p>
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

function MiniStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-ink-700 bg-ink-900 p-4 shadow-[0_5px_0_0_var(--color-ink-700)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
        {icon}
      </div>
      <p className={cn("mt-2 truncate font-display text-2xl", accent)}>{value}</p>
    </div>
  );
}
