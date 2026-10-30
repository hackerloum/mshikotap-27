"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCountdown } from "@/hooks/use-countdown";
import { challengesService } from "@/services/challenges.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Challenge } from "@/types";

const statusTone = {
  live: "success",
  upcoming: "info",
  ended: "default",
} as const;

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const countdown = useCountdown(challenge.endsAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[challenge.status]}>
            {challenge.status}
          </Badge>
          <Badge tone="brand">{challenge.type.replaceAll("_", " ")}</Badge>
        </div>
        <CardTitle className="mt-2 font-[family-name:var(--font-display)] text-xl">
          {challenge.title}
        </CardTitle>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Reward pool</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
              {formatCurrency(challenge.rewardPool)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Participants</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
              {formatNumber(challenge.participants)}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {countdown.done ? "Ended" : "Ends in"}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-teal-300">
            {countdown.done ? "Challenge closed" : countdown.label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await challengesService.list();
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error.message);
        setChallenges([]);
      } else {
        setChallenges(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen mesh-bg">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-rise max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
            Challenges
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
            Race the clock. Share the pool.
          </h1>
          <p className="mt-3 text-slate-400">
            Live referral races, flash sprints, and weekend XP rushes.
          </p>
        </div>

        <div className="mt-10">
          {loading ? (
            <p className="text-sm text-slate-400">Loading challenges…</p>
          ) : challenges.length === 0 ? (
            <EmptyState title="No challenges right now" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
