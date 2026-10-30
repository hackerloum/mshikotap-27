"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="space-y-6 animate-rise">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Credits"
            value={formatNumber(user?.advertiserCredits ?? 0)}
            hint="Available campaign budget"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            label="Active campaigns"
            value={formatNumber(active)}
            hint={`${campaigns.length} total`}
            icon={<Flag className="h-5 w-5" />}
          />
          <StatCard label="Credits spent" value={formatNumber(spent)} />
          <StatCard label="Completions" value={formatNumber(completions)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/advertiser/campaigns">
            <Button>Manage campaigns</Button>
          </Link>
          <Link href="/advertiser/credits">
            <Button variant="secondary">Buy credits</Button>
          </Link>
          <Link href="/advertiser/analytics">
            <Button variant="outline">View analytics</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    {c.type.replaceAll("_", " ")} · {formatNumber(c.completions)}{" "}
                    actions · {formatNumber(c.spentCredits)}/
                    {formatNumber(c.budgetCredits)} credits
                  </p>
                </div>
                <Badge tone={statusTone[c.status]}>{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
