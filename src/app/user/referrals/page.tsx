"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin, Flame, Star } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat";
import { challengesService } from "@/services/challenges.service";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { LeaderboardEntry, ReferralStats } from "@/types";
import { toast } from "sonner";

const tiers = [
  { need: 3, name: "Rookie squad", reward: "Bonus coins" },
  { need: 10, name: "Pro squad", reward: "Bigger bonus" },
  { need: 25, name: "Legend squad", reward: "Top reward" },
];

export default function UserReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void Promise.all([
      challengesService.referralStats(),
      challengesService.leaderboard(),
    ]).then(([s, l]) => {
      if (s.ok) setStats(s.data);
      if (l.ok) setBoard(l.data.slice(0, 8));
    });
  }, []);

  const code = stats?.code || user?.referralCode || "—";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/register?ref=${code}`;
  const total = stats?.totalReferrals ?? 0;
  const nextTier = tiers.find((t) => total < t.need);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Invite link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the link instead.");
    }
  }

  async function shareLink() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Join my squad on MshikoTap",
          text: "Do quests, earn coins. Join my squad!",
          url: shareUrl,
        });
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  }

  return (
    <DashboardShell role="user" title="Squad">
      <div className="space-y-6">
        <section className="dots rounded-3xl border-2 border-sky-deep bg-sky p-5 text-ink-950 shadow-[0_6px_0_0_var(--color-sky-deep)] sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-ink-950/70">
                Build your squad
              </p>
              <h2 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">
                Bring friends. Win together.
              </h2>
              <p className="mt-1 text-sm font-bold text-ink-950/75">
                Every friend who joins and plays earns you a reward.
              </p>
            </div>
            <Users className="hidden h-14 w-14 shrink-0 sm:block" />
          </div>

          <div className="mt-5 rounded-2xl bg-ink-950 p-4 text-white">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Your code
            </p>
            <p className="mt-0.5 truncate font-display text-4xl tracking-widest text-coin">
              {code}
            </p>
            <p className="mt-2 break-all rounded-xl border-2 border-ink-700 bg-ink-900 px-3 py-2.5 text-sm font-semibold text-slate-300">
              {shareUrl}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="default" size="lg" onClick={() => void copyLink()}>
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <Button variant="white" size="lg" onClick={() => void shareLink()}>
              <Share2 className="h-5 w-5" />
              Invite friends
            </Button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Squad size"
            value={formatNumber(total)}
            tone="sky"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            label="Active now"
            value={formatNumber(stats?.activeReferrals ?? 0)}
            tone="flame"
            icon={<Flame size={28} />}
          />
          <StatCard
            label="Squad earnings"
            value={formatCurrency(stats?.earnings ?? 0)}
            hint={`Rank #${stats?.rank ?? "—"}`}
            tone="coin"
            icon={<Coin size={28} />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Squad goals</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              {nextTier
                ? `${nextTier.need - total} more ${nextTier.need - total === 1 ? "friend" : "friends"} to reach ${nextTier.name}.`
                : "Max rank reached. You're a legend!"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {tiers.map((t) => {
              const done = total >= t.need;
              return (
                <div
                  key={t.name}
                  className={cn(
                    "rounded-2xl border-2 p-3.5",
                    done
                      ? "border-mint bg-mint/10"
                      : "border-ink-700 bg-ink-800",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        done ? "bg-mint text-ink-950" : "bg-ink-700 text-slate-300",
                      )}
                    >
                      {done ? <Check className="h-6 w-6" /> : <Star size={26} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg text-white">
                        {t.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {t.need} friends · {t.reward}
                      </p>
                    </div>
                    <Badge tone={done ? "success" : "default"}>
                      {done ? "Done" : `${Math.min(total, t.need)}/${t.need}`}
                    </Badge>
                  </div>
                  {!done ? (
                    <ProgressBar
                      className="mt-3"
                      value={total}
                      max={t.need}
                      tone="sky"
                      label={`Progress to ${t.name}`}
                    />
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Top squads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.length === 0 ? (
              <EmptyState
                title="No ranks yet"
                description="Be the first on the board."
              />
            ) : (
              board.map((entry) => {
                const me = entry.userId === user?.uid;
                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5",
                      me
                        ? "border-coin bg-coin/10"
                        : "border-ink-700 bg-ink-800",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-lg",
                        entry.rank === 1
                          ? "bg-coin text-ink-950"
                          : entry.rank === 2
                            ? "bg-slate-300 text-ink-950"
                            : entry.rank === 3
                              ? "bg-flame text-ink-950"
                              : "bg-ink-700 text-slate-300",
                      )}
                    >
                      {entry.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-extrabold text-white">
                      {entry.displayName}
                      {me ? (
                        <Badge tone="brand" className="ml-2 align-middle">
                          You
                        </Badge>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-display text-lg text-coin">
                      {formatNumber(entry.score)}
                      <span className="ml-1 text-xs text-slate-400">pts</span>
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
