"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { subscriptionTiers } from "@/config/subscriptions";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function UserSettingsPage() {
  const user = useAuthStore((s) => s.user);

  const plan =
    subscriptionTiers.find((t) => t.id === user?.subscription) ??
    subscriptionTiers.find((t) => t.id === "pro");

  return (
    <DashboardShell role="user" title="Settings">
      <div className="space-y-6 animate-rise">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input value={user?.displayName ?? ""} readOnly />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={user?.phone ?? "—"} readOnly />
            </div>
            <div>
              <Label>Referral code</Label>
              <Input value={user?.referralCode ?? ""} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subscription</CardTitle>
            <Badge tone="brand">{user?.subscription ?? "free"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan ? (
              <>
                <p className="text-sm text-slate-300">
                  {plan.name} · {formatCurrency(plan.priceMonthly)}/mo ·{" "}
                  {formatNumber(plan.starterCredits)} starter credits
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-300"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-slate-400">Free plan</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gamification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge tone="info">Level {user?.gamification.level ?? 1}</Badge>
            <Badge tone="brand">
              {formatNumber(user?.gamification.xp ?? 0)} XP
            </Badge>
            <Badge tone="success">
              {user?.gamification.streakDays ?? 0}-day streak
            </Badge>
            {(user?.gamification.badges ?? []).map((b) => (
              <Badge key={b}>{b.replaceAll("_", " ")}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
