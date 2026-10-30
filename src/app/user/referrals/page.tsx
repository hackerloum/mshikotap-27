"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { challengesService } from "@/services/challenges.service";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { LeaderboardEntry, ReferralStats } from "@/types";
import { toast } from "sonner";

export default function UserReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);

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
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${code}`
      : `/register?ref=${code}`;

  return (
    <DashboardShell role="user" title="Referrals">
      <div className="space-y-6 animate-rise">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Your code" value={code} />
          <StatCard
            label="Total referrals"
            value={formatNumber(stats?.totalReferrals ?? 0)}
          />
          <StatCard
            label="Active"
            value={formatNumber(stats?.activeReferrals ?? 0)}
          />
          <StatCard
            label="Earnings"
            value={formatCurrency(stats?.earnings ?? 0)}
            hint={`Rank #${stats?.rank ?? "—"}`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Share your invite</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-teal-200">
              {shareUrl}
            </code>
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Referral link copied");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard snippet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-sm text-slate-500">#{entry.rank}</span>
                  <span className="text-sm text-white">
                    {entry.displayName}
                    {entry.userId === user?.uid ? (
                      <Badge tone="brand" className="ml-2">
                        You
                      </Badge>
                    ) : null}
                  </span>
                </div>
                <span className="text-sm text-teal-300">
                  {formatNumber(entry.score)} pts
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
