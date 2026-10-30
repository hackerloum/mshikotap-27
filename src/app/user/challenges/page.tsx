"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { challengesService } from "@/services/challenges.service";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Challenge } from "@/types";

const statusTone = {
  live: "success",
  upcoming: "info",
  ended: "default",
} as const;

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const countdown = useCountdown(challenge.endsAt);
  const startCountdown = useCountdown(challenge.startsAt);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{challenge.title}</CardTitle>
          <p className="mt-1 text-sm text-slate-400">{challenge.description}</p>
        </div>
        <Badge tone={statusTone[challenge.status]}>{challenge.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="brand">{challenge.type.replaceAll("_", " ")}</Badge>
          <Badge>Pool {formatCurrency(challenge.rewardPool)}</Badge>
          <Badge tone="info">
            {formatNumber(challenge.participants)} joined
          </Badge>
        </div>
        <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            {challenge.status === "upcoming" ? "Starts in" : "Ends in"}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-teal-200">
            {challenge.status === "upcoming"
              ? startCountdown.label
              : countdown.done
                ? "Ended"
                : countdown.label}
          </p>
        </div>
      </CardContent>
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
    <DashboardShell role="user" title="Challenges">
      <div className="space-y-6 animate-rise">
        {challenges.length === 0 ? (
          <EmptyState
            title="No challenges"
            description="Check back soon for referral races and flash sprints."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((ch) => (
              <ChallengeCard key={ch.id} challenge={ch} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
