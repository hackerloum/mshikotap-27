"use client";

import { useEffect, useState } from "react";
import { Swords, Timer, Trophy, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { challengesService } from "@/services/challenges.service";
import { useCountdown } from "@/hooks/use-countdown";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { Challenge } from "@/types";

const statusTone = {
  live: "success",
  upcoming: "info",
  ended: "default",
} as const;

const statusLabel = {
  live: "Live",
  upcoming: "Soon",
  ended: "Over",
} as const;

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const countdown = useCountdown(challenge.endsAt);
  const startCountdown = useCountdown(challenge.startsAt);

  const start = new Date(challenge.startsAt).getTime();
  const end = new Date(challenge.endsAt).getTime();
  const elapsed = Math.max(0, end - start - countdown.remaining);
  const total = Math.max(1, end - start);
  const upcoming = challenge.status === "upcoming";
  const ended = challenge.status === "ended" || countdown.done;

  const timeLabel = upcoming
    ? startCountdown.label
    : ended
      ? "Race over"
      : countdown.label;

  return (
    <Card
      className={cn(
        "overflow-hidden",
        challenge.status === "live" && "border-mint shadow-[0_5px_0_0_var(--color-mint-deep)]",
      )}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
              challenge.status === "live"
                ? "bg-mint text-ink-950"
                : upcoming
                  ? "bg-sky/20 text-sky"
                  : "bg-ink-700 text-slate-300",
            )}
          >
            <Swords className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight text-white">
              {challenge.title}
            </h3>
            <p className="mt-0.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {challenge.type.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <Badge tone={statusTone[challenge.status]}>
          {statusLabel[challenge.status]}
        </Badge>
      </div>

      <div className="space-y-4 p-5 pt-1">
        <p className="text-sm text-slate-300">{challenge.description}</p>

        <div className="flex items-center gap-3 rounded-2xl bg-coin/10 p-3">
          <Coin size={40} />
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Prize pool
            </p>
            <p className="truncate font-display text-3xl leading-none text-coin">
              {formatCurrency(challenge.rewardPool)}
            </p>
          </div>
          <Trophy className="ml-auto h-7 w-7 shrink-0 text-coin" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-slate-400">
              <Timer className="h-4 w-4" />
              {upcoming ? "Starts in" : ended ? "Finished" : "Ends in"}
            </span>
            <span className="truncate font-display text-base normal-case tracking-normal text-white">
              {timeLabel}
            </span>
          </div>
          <ProgressBar
            value={upcoming ? 0 : ended ? total : elapsed}
            max={total}
            tone={upcoming ? "sky" : ended ? "coin" : "mint"}
            label="Race progress"
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-300">
          <Users className="h-4 w-4 text-sky" />
          {formatNumber(challenge.participants)} racing
        </div>
      </div>
    </Card>
  );
}

export default function UserChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    void challengesService.list().then((res) => {
      if (res.ok) setChallenges(res.data);
    });
  }, []);

  return (
    <DashboardShell role="user" title="Races">
      <div className="space-y-6">
        {challenges.length === 0 ? (
          <EmptyState
            title="No races right now"
            description="Check back soon for referral races and flash sprints."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {challenges.map((ch) => (
              <ChallengeCard key={ch.id} challenge={ch} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
