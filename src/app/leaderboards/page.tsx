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
import { challengesService } from "@/services/challenges.service";
import { formatNumber } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

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

  return (
    <div className="min-h-screen mesh-bg">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-rise">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
            Leaderboards
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
            Top earners this race.
          </h1>
          <p className="mt-3 text-slate-400">
            Public standings from the live referral and task challenges.
          </p>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-xl">
              Referral race
            </CardTitle>
            <CardDescription>Ranked by challenge score</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-400">Loading leaderboard…</p>
            ) : entries.length === 0 ? (
              <EmptyState title="No rankings yet" />
            ) : (
              <ol className="space-y-3">
                {entries.map((entry) => (
                  <li
                    key={entry.userId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          entry.rank <= 3
                            ? "grid h-9 w-9 place-items-center rounded-lg bg-teal-400/15 font-[family-name:var(--font-display)] text-sm font-semibold text-teal-200"
                            : "grid h-9 w-9 place-items-center rounded-lg bg-white/5 font-[family-name:var(--font-display)] text-sm font-semibold text-slate-400"
                        }
                      >
                        {entry.rank}
                      </span>
                      <div>
                        <p className="font-medium text-white">
                          {entry.displayName}
                        </p>
                        {entry.rank <= 3 ? (
                          <Badge tone="brand" className="mt-1">
                            Podium
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-cyan-300">
                      {formatNumber(entry.score)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
