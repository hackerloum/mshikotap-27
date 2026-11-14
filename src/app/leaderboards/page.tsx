"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Medal, Trophy } from "lucide-react";
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
  "bg-coin/10 text-coin",
  "bg-mint/10 text-mint",
  "bg-sky/10 text-sky",
  "bg-flame/10 text-flame",
  "bg-coral/10 text-coral",
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
        "grid shrink-0 place-items-center rounded-full font-display",
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
    <span className="tabular inline-flex items-center rounded-md bg-sky/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky">
      Lv {level}
    </span>
  );
}

const podiumLook = {
  1: {
    height: "h-28 sm:h-36",
    accent: "border-t-coin",
    text: "text-coin",
    ring: "ring-coin",
    avatar: "h-14 w-14 text-2xl sm:h-[4.5rem] sm:w-[4.5rem] sm:text-3xl",
    icon: Trophy,
    label: "First place",
  },
  2: {
    height: "h-24 sm:h-28",
    accent: "border-t-slate-300",
    text: "text-slate-300",
    ring: "ring-slate-300",
    avatar: "h-12 w-12 text-xl sm:h-14 sm:w-14 sm:text-2xl",
    icon: Medal,
    label: "Second place",
  },
  3: {
    height: "h-20 sm:h-24",
    accent: "border-t-flame",
    text: "text-flame",
    ring: "ring-flame",
    avatar: "h-12 w-12 text-xl sm:h-14 sm:w-14 sm:text-2xl",
    icon: Medal,
    label: "Third place",
  },
} as const;

function PodiumSpot({ entry }: { entry: LeaderboardEntry }) {
  const look = podiumLook[entry.rank as 1 | 2 | 3];
  const Icon = look.icon;
  return (
    <li className="flex min-w-0 flex-col items-center">
      <Icon className={cn("mb-2 h-6 w-6", look.text)} role="img" aria-label={look.label} />
      <Avatar
        name={entry.displayName}
        className={cn("ring-2 ring-offset-2 ring-offset-ink-950", look.ring, look.avatar)}
      />
      <p className="mt-2 w-full truncate px-1 text-center text-sm font-semibold text-white sm:text-base">
        {entry.displayName}
      </p>
      <div className="mt-1">
        <LevelChip level={entry.level ?? 1} />
      </div>
      <div
        className={cn(
          "mt-3 flex w-full flex-col items-center justify-start rounded-t-xl border border-t-2 border-ink-700/80 bg-ink-900 pt-2",
          look.height,
          look.accent,
        )}
      >
        <span className={cn("tabular font-display text-3xl leading-none sm:text-4xl", look.text)}>
          {entry.rank}
        </span>
        <span className="tabular mt-1 max-w-full truncate px-1 font-display text-sm text-white sm:text-base">
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
        <section className="grid-bg border-b border-ink-700/80">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center sm:pb-12 sm:pt-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-coin">
              Leaderboard
            </p>
            <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl leading-[1.1] text-white sm:text-5xl">
              Climb the <span className="text-coin">board</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-300 sm:text-lg">
              Top players in the live referral race. Score points and move up
              the ranks.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-10">
          {loading ? (
            <p className="text-center text-sm text-slate-400">
              Loading the board…
            </p>
          ) : entries.length === 0 ? (
            <EmptyState
              title="Nobody on the board yet"
              description="Be the first to score in a race."
              action={
                <Link href="/login" className={buttonVariants({ size: "default" })}>
                  Join a race
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
                <ol className="mt-8 space-y-2">
                  {rest.map((entry) => (
                    <li
                      key={entry.userId}
                      className="flex min-h-16 items-center gap-3 rounded-xl border border-ink-700/80 bg-ink-900 px-3 py-2 sm:px-4"
                    >
                      <span className="tabular w-8 shrink-0 text-center font-display text-lg text-slate-400">
                        {entry.rank}
                      </span>
                      <Avatar
                        name={entry.displayName}
                        className="h-10 w-10 text-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                          {entry.displayName}
                        </p>
                        <LevelChip level={entry.level ?? 1} />
                      </div>
                      <p className="tabular flex shrink-0 items-center gap-1.5 font-display text-lg text-coin">
                        <Coin size={18} />
                        {formatNumber(entry.score)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}

              <div className="mt-10 rounded-xl border border-ink-700/80 bg-ink-900 p-5 text-center shadow-sm shadow-black/20">
                <p className="font-display text-xl text-white">
                  Your name could be up here
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Join a race and start scoring.
                </p>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}
                >
                  Get started
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
