"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Timer, Users } from "lucide-react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { useCountdown } from "@/hooks/use-countdown";
import { challengesService } from "@/services/challenges.service";
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
  ended: "Ended",
} as const;

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const countdown = useCountdown(challenge.endsAt);
  const start = new Date(challenge.startsAt).getTime();
  const end = new Date(challenge.endsAt).getTime();
  const span = Math.max(1, end - start);
  const elapsed = countdown.done
    ? span
    : Math.min(span, Math.max(0, Date.now() - start));
  const ended = challenge.status === "ended" || countdown.done;
  const upcoming = challenge.status === "upcoming";

  return (
    <article
      className={cn(
        "flex flex-col rounded-3xl border-2 bg-ink-900 p-5",
        ended
          ? "border-ink-700 shadow-[0_5px_0_0_var(--color-ink-700)]"
          : "border-coin shadow-[0_5px_0_0_var(--color-coin-deep)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone[challenge.status]}>
          {challenge.status === "live" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          ) : null}
          {statusLabel[challenge.status]}
        </Badge>
        <Badge tone="brand">{challenge.type.replaceAll("_", " ")}</Badge>
      </div>

      <h2 className="mt-3 font-display text-2xl leading-tight text-white">
        {challenge.title}
      </h2>
      <p className="mt-1.5 text-sm font-semibold text-slate-400">
        {challenge.description}
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ink-800 p-3">
        <Coin size={36} />
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Prize pool
          </p>
          <p className="truncate font-display text-2xl leading-tight text-coin">
            {formatCurrency(challenge.rewardPool)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" aria-hidden="true" />
            {ended ? "Ended" : upcoming ? "Starts soon" : "Ends in"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {formatNumber(challenge.participants)} racing
          </span>
        </div>
        <ProgressBar
          value={elapsed}
          max={span}
          tone={ended ? "sky" : "flame"}
          label="Race time used"
        />
        <p className="mt-2 font-display text-xl text-white">
          {ended ? "Race closed" : countdown.label}
        </p>
      </div>

      <Link
        href="/login"
        className={cn(
          buttonVariants({
            variant: ended ? "secondary" : "default",
            size: "lg",
          }),
          "mt-5 w-full",
        )}
      >
        {ended ? "See next races" : upcoming ? "Get ready" : "Join the race"}
      </Link>
    </article>
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
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <MarketingHeader />
      <main>
        <section className="dots border-b-2 border-ink-800">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:pb-12 sm:pt-14">
            <p className="text-xs font-extrabold uppercase tracking-wider text-flame">
              Races
            </p>
            <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.05] text-white sm:text-6xl">
              Jump into a <span className="scribble text-coin">race</span> 🏁
            </h1>
            <p className="mt-3 max-w-xl text-base font-semibold text-slate-300 sm:text-lg">
              Beat the clock, score points, share the prize pool.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10">
          {loading ? (
            <p className="text-sm font-semibold text-slate-400">
              Loading races…
            </p>
          ) : challenges.length === 0 ? (
            <EmptyState
              title="No races right now"
              description="Check back soon. New ones drop all the time."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
