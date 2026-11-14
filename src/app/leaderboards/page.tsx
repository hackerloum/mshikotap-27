"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { challengesService } from "@/services/challenges.service";
import { cn, formatNumber } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const rowTones = [
  "bg-coin text-ink-950",
  "bg-mint text-ink-950",
  "bg-sky text-ink-950",
  "bg-flame text-ink-950",
  "bg-coral text-white",
];

function avatarTone(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return rowTones[sum % rowTones.length];
}

function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-ink-950 font-display",
        avatarTone(name),
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function LevelChip({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-sky/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-sky">
      Lv {level}
    </span>
  );
}

const podiumLook = {
  1: {
    height: "h-32 sm:h-40",
    block:
      "bg-coin text-ink-950 border-ink-950 shadow-[0_5px_0_0_var(--color-coin-deep)]",
    ring: "ring-coin",
    avatar: "h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl",
    medal: "🏆",
  },
  2: {
    height: "h-24 sm:h-28",
    block:
      "bg-slate-300 text-ink-950 border-ink-950 shadow-[0_5px_0_0_#8b92b3]",
    ring: "ring-slate-300",
    avatar: "h-12 w-12 text-2xl sm:h-16 sm:w-16 sm:text-3xl",
    medal: "🥈",
  },
  3: {
    height: "h-20 sm:h-24",
    block:
      "bg-flame text-ink-950 border-ink-950 shadow-[0_5px_0_0_var(--color-flame-deep)]",
    ring: "ring-flame",
    avatar: "h-12 w-12 text-2xl sm:h-16 sm:w-16 sm:text-3xl",
    medal: "🥉",
  },
} as const;

function PodiumSpot({ entry }: { entry: LeaderboardEntry }) {
  const look = podiumLook[entry.rank as 1 | 2 | 3];
  return (
    <li className="flex min-w-0 flex-col items-center">
      <span className="text-2xl" aria-hidden="true">
        {look.medal}
      </span>
      <Avatar
        name={entry.displayName}
        className={cn("ring-4 ring-offset-2 ring-offset-ink-950", look.ring, look.avatar)}
      />
      <p className="mt-2 w-full truncate px-1 text-center text-sm font-extrabold text-white sm:text-base">
        {entry.displayName}
      </p>
      <div className="mt-1">
        <LevelChip level={entry.level ?? 1} />
      </div>
      <div
        className={cn(
          "mt-3 flex w-full flex-col items-center justify-start rounded-t-2xl border-2 pt-2",
          look.height,
          look.block,
        )}
      >
        <span className="font-display text-4xl leading-none sm:text-5xl">
          {entry.rank}
        </span>
        <span className="mt-1 max-w-full truncate px-1 font-display text-sm sm:text-lg">
          {formatNumber(entry.score)}
        </span>
      </div>
    </li>
  );
}

export default function LeaderboardsPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await challengesService.leaderboard();
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error.message);
        setEntries([]);
      } else {
        setEntries(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const top = sorted.filter((e) => e.rank >= 1 && e.rank <= 3).slice(0, 3);
  const podium = [2, 1, 3]
    .map((r) => top.find((e) => e.rank === r))
    .filter((e): e is LeaderboardEntry => Boolean(e));
  const rest = sorted.filter((e) => !top.includes(e));

  return (
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <MarketingHeader />
      <main>
        <section className="dots border-b-2 border-ink-800">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center sm:pb-12 sm:pt-14">
            <p className="text-xs font-extrabold uppercase tracking-wider text-coin">
              Leaderboard
            </p>
            <h1 className="mx-auto mt-2 max-w-2xl font-display text-4xl leading-[1.05] text-white sm:text-6xl">
              Climb the <span className="scribble text-coin">board</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base font-semibold text-slate-300 sm:text-lg">
              Top players in the live referral race. Score points, take the
              crown.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-10">
          {loading ? (
            <p className="text-center text-sm font-semibold text-slate-400">
              Loading the board…
            </p>
          ) : entries.length === 0 ? (
            <EmptyState
              title="Nobody on the board yet"
              description="Be the first to score in a race."
              action={
                <Link href="/login" className={buttonVariants({ size: "default" })}>
                  Jump in
                </Link>
              }
            />
          ) : (
            <>
              {podium.length > 0 ? (
                <ol
                  className="grid grid-cols-3 items-end gap-2 sm:gap-4"
                  aria-label="Top three players"
                >
                  {podium.map((entry) => (
                    <PodiumSpot key={entry.userId} entry={entry} />
                  ))}
                </ol>
              ) : null}

              {rest.length > 0 ? (
                <ol className="mt-8 space-y-3">
                  {rest.map((entry) => (
                    <li
                      key={entry.userId}
                      className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-ink-700 bg-ink-900 px-3 py-2 shadow-[0_4px_0_0_var(--color-ink-700)] sm:px-4"
                    >
                      <span className="w-8 shrink-0 text-center font-display text-xl text-slate-400">
                        {entry.rank}
                      </span>
                      <Avatar
                        name={entry.displayName}
                        className="h-11 w-11 text-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-white">
                          {entry.displayName}
                        </p>
                        <LevelChip level={entry.level ?? 1} />
                      </div>
                      <p className="flex shrink-0 items-center gap-1.5 font-display text-xl text-coin">
                        <Coin size={20} />
                        {formatNumber(entry.score)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}

              <div className="mt-10 rounded-3xl border-2 border-ink-700 bg-ink-900 p-5 text-center shadow-[0_5px_0_0_var(--color-ink-700)]">
                <p className="font-display text-2xl text-white">
                  Your name could be up here
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Join a race and start scoring.
                </p>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}
                >
                  Play now
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
