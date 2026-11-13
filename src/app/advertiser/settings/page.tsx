"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { subscriptionTiers } from "@/config/subscriptions";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function AdvertiserSettingsPage() {
  const user = useAuthStore((s) => s.user);

  const plan = subscriptionTiers.find((t) => t.id === user?.subscription);

  return (
    <DashboardShell role="advertiser" title="Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              You sign in with Google, so these details come from your Google
              account.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Brand name</Label>
              <Input value={user?.displayName ?? ""} readOnly />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user?.role ?? "advertiser"} readOnly />
            </div>
            <div>
              <Label>Credits</Label>
              <Input
                value={formatNumber(user?.advertiserCredits ?? 0)}
                readOnly
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Plan</CardTitle>
            <Badge tone="brand">{user?.subscription ?? "free"}</Badge>
          </CardHeader>
          <CardContent>
            {plan ? (
              <p className="text-sm text-slate-300">
                {plan.name} · {formatCurrency(plan.priceMonthly)}/mo · includes{" "}
                {formatNumber(plan.starterCredits)} starter credits
              </p>
            ) : (
              <p className="text-sm text-slate-400">No paid plan</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
