"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, Flag, Receipt, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat";
import { campaignsService } from "@/services/campaigns.service";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";
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
    void campaignsService.list().then((res) => {
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
            value={formatCurrency(user?.advertiserCredits ?? 0)}
            hint="Available to spend"
            icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
            tone="coin"
          />
          <StatCard
            label="Active campaigns"
            value={formatNumber(active)}
            hint={`${campaigns.length} total`}
            icon={<Flag className="h-5 w-5" aria-hidden="true" />}
            tone="mint"
          />
          <StatCard
            label="Credits spent"
            value={formatCurrency(spent)}
            icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
            tone="flame"
          />
          <StatCard
            label="Completions"
            value={formatNumber(completions)}
            icon={<CircleCheck className="h-5 w-5" aria-hidden="true" />}
            tone="sky"
          />
        </div>

        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link href="/advertiser/campaigns">
            <Button className="w-full sm:w-auto">Manage campaigns</Button>
          </Link>
          <Link href="/advertiser/credits">
            <Button variant="secondary" className="w-full sm:w-auto">
              Top up credits
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
            <CardTitle className="text-xl">Your campaigns</CardTitle>
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
                  className="space-y-3 rounded-xl border border-ink-700/80 bg-ink-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base text-white">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {c.type.replaceAll("_", " ")} ·{" "}
                        <span className="tabular">{formatNumber(c.completions)}</span>{" "}
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
                  <p className="tabular text-xs text-slate-400">
                    {formatCurrency(c.spentCredits)} / {formatCurrency(c.budgetCredits)}
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
