"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat";
import { campaignsService } from "@/services/campaigns.service";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/lib/utils";
import type { Campaign } from "@/types";

const statusTone = {
  draft: "default",
  active: "success",
  paused: "warning",
  completed: "info",
  rejected: "danger",
} as const;

export default function AdvertiserOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!user) return;
    void campaignsService.list(user.uid).then((res) => {
      if (res.ok) setCampaigns(res.data);
    });
  }, [user]);

  const active = campaigns.filter((c) => c.status === "active").length;
  const spent = campaigns.reduce((sum, c) => sum + c.spentCredits, 0);
  const completions = campaigns.reduce((sum, c) => sum + c.completions, 0);

  return (
    <DashboardShell role="advertiser" title="Overview">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Credits"
            value={formatNumber(user?.advertiserCredits ?? 0)}
            hint="Available to spend"
            icon={<Wallet className="h-5 w-5" />}
            tone="coin"
          />
          <StatCard
            label="Active campaigns"
            value={formatNumber(active)}
            hint={`${campaigns.length} total`}
            icon={<Flag className="h-5 w-5" />}
            tone="mint"
          />
          <StatCard label="Credits spent" value={formatNumber(spent)} tone="flame" />
          <StatCard label="Completions" value={formatNumber(completions)} tone="sky" />
        </div>

        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link href="/advertiser/campaigns">
            <Button className="w-full sm:w-auto">Manage campaigns</Button>
          </Link>
          <Link href="/advertiser/credits">
            <Button variant="secondary" className="w-full sm:w-auto">
              Buy credits
            </Button>
          </Link>
          <Link href="/advertiser/analytics">
            <Button variant="outline" className="w-full sm:w-auto">
              View stats
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length === 0 ? (
              <EmptyState
                title="No campaigns yet"
                description="Start one from the campaigns page."
              />
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="space-y-2 rounded-2xl border-2 border-ink-700 bg-ink-800 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg text-white">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.type.replaceAll("_", " ")} · {formatNumber(c.completions)}{" "}
                        actions
                      </p>
                    </div>
                    <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                  </div>
                  <ProgressBar
                    value={c.spentCredits}
                    max={Math.max(1, c.budgetCredits)}
                    tone="coin"
                    label={`${c.title} budget used`}
                  />
                  <p className="text-xs text-slate-400">
                    {formatNumber(c.spentCredits)} / {formatNumber(c.budgetCredits)}{" "}
                    credits
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
