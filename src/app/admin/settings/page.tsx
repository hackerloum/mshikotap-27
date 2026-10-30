"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { siteConfig } from "@/config/site";

export default function AdminSettingsPage() {
  return (
    <DashboardShell role="admin" title="Platform settings">
      <div className="space-y-6 animate-rise">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>General</CardTitle>
            <Badge tone={siteConfig.demoMode ? "warning" : "success"}>
              {siteConfig.demoMode ? "demo mode" : "live"}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>App name</Label>
              <Input value={siteConfig.name} readOnly />
            </div>
            <div>
              <Label>Support email</Label>
              <Input value={siteConfig.supportEmail} readOnly />
            </div>
            <div>
              <Label>Public URL</Label>
              <Input value={siteConfig.url} readOnly />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={siteConfig.currency} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet rules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Minimum withdrawal</Label>
              <Input value={String(siteConfig.minWithdrawal)} readOnly />
            </div>
            <div>
              <Label>Withdrawal fee %</Label>
              <Input value={String(siteConfig.withdrawalFeePercent)} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations (placeholders)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              "Firebase Auth session cookies",
              "FCM push notifications",
              "Mobile money payouts",
              "AI screenshot verification",
              "SMS / WhatsApp providers",
              "Rate-limit middleware",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-slate-400"
              >
                {item} · coming later
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
