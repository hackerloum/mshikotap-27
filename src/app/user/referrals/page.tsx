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
import { useConfigStore } from "@/store/config-store";
import type { LeaderboardEntry, ReferralStats } from "@/types";
import { toast } from "sonner";

const tiers = [
  { need: 3, name: "Rookie squad" },
  { need: 10, name: "Pro squad" },
  { need: 25, name: "Legend squad" },
];

export default function UserReferralsPage() {
  const referralBonus = useConfigStore((c) => c.config.referralBonus);
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
          text: "Complete quests and earn coins. Join my squad.",
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
        <section className="rounded-xl border border-ink-700/80 bg-ink-900 p-5 shadow-sm shadow-black/20 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-sky/10 text-sky">
              <Users className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Referral program
              </p>
              <h2 className="mt-1 font-display text-2xl leading-tight text-white">
                Invite friends and earn together
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Earn{" "}
                <span className="tabular font-semibold text-coin">{formatCurrency(referralBonus)}</span>{" "}
                when a friend you invite gets their first quest approved.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-ink-700/80 bg-ink-950 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Your code
            </p>
            <p className="mt-0.5 truncate font-display text-3xl tracking-widest text-coin">
              {code}
            </p>
            <p className="mt-2 break-all rounded-lg border border-ink-700/80 bg-ink-900 px-3 py-2.5 text-sm text-slate-300">
              {shareUrl}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="default" size="lg" onClick={() => void copyLink()}>
              {copied ? (
                <Check className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Copy className="h-5 w-5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => void shareLink()}>
              <Share2 className="h-5 w-5" aria-hidden="true" />
              Invite friends
            </Button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Squad size"
            value={formatNumber(total)}
            tone="sky"
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="Active now"
            value={formatNumber(stats?.activeReferrals ?? 0)}
            tone="flame"
            icon={<Flame size={22} />}
          />
          <StatCard
            label="Squad earnings"
            value={formatCurrency(stats?.earnings ?? 0)}
            hint={`Rank #${stats?.rank ?? "—"}`}
            tone="coin"
            icon={<Coin size={22} />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Squad goals</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              {nextTier
                ? `${nextTier.need - total} more ${nextTier.need - total === 1 ? "friend" : "friends"} to reach ${nextTier.name}.`
                : "Top tier reached."}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {tiers.map((t) => {
              const done = total >= t.need;
              return (
                <div
                  key={t.name}
                  className={cn(
                    "rounded-lg border p-3.5",
                    done
                      ? "border-mint/40 bg-mint/10"
                      : "border-ink-700/80 bg-ink-800",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                        done ? "bg-mint/15 text-mint" : "bg-ink-700 text-slate-300",
                      )}
                    >
                      {done ? <Check className="h-5 w-5" aria-hidden="true" /> : <Star size={20} className="text-current" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base text-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t.need} friends
                      </p>
                    </div>
                    <Badge tone={done ? "success" : "default"} className="tabular">
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
            <CardTitle className="text-xl">Top squads</CardTitle>
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
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                      me
                        ? "border-coin/60 bg-coin/10"
                        : "border-ink-700/80 bg-ink-800",
                    )}
                  >
                    <span
                      className={cn(
                        "tabular grid h-8 w-8 shrink-0 place-items-center rounded-md font-display text-sm",
                        entry.rank === 1
                          ? "bg-coin/15 text-coin"
                          : entry.rank === 2
                            ? "bg-slate-300/15 text-slate-200"
                            : entry.rank === 3
                              ? "bg-flame/15 text-flame"
                              : "bg-ink-700 text-slate-300",
                      )}
                    >
                      {entry.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-white">
                      {entry.displayName}
                      {me ? (
                        <Badge tone="brand" className="ml-2 align-middle">
                          You
                        </Badge>
                      ) : null}
                    </span>
                    <span className="tabular shrink-0 font-display text-base text-coin">
                      {formatNumber(entry.score)}
                      <span className="ml-1 text-xs font-medium text-slate-400">pts</span>
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
