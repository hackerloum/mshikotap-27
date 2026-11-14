"use client";

import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paymentsService } from "@/services/payments.service";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import { formatCurrency } from "@/lib/utils";

export default function PremiumPage() {
  const user = useAuthStore((s) => s.user);
  const cfg = useConfigStore((s) => s.config);
  const [busy, setBusy] = useState(false);

  const until = user?.premiumUntil ? new Date(user.premiumUntil) : null;
  const active = Boolean(user?.subscription === "premium" && until && until.getTime() > Date.now());
  const daysLeft = until ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86_400_000)) : 0;

  const perks = [
    `${cfg.premiumMultiplier}x daily bonus every day`,
    `${cfg.premiumMultiplier}x quests and earnings allowed per day`,
    "Premium badge on your profile",
    ...(cfg.requirePremiumToCashOut ? ["Required to cash out"] : ["Priority when we review your cash outs"]),
  ];

  async function pay() {
    setBusy(true);
    const res = await paymentsService.checkout("premium");
    if (!res.ok) {
      setBusy(false);
      toast.error(res.error.message);
      return;
    }
    window.location.href = res.data.checkoutUrl;
  }

  return (
    <DashboardShell role="user" title="Premium">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-coin">MshikoTap Premium</p>
                <h2 className="mt-1 font-display text-4xl text-white">
                  {formatCurrency(cfg.premiumPrice)}
                  <span className="ml-2 text-lg text-slate-400">for {cfg.premiumDays} days</span>
                </h2>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-coin/15 text-coin">
                <Crown className="h-7 w-7" />
              </div>
            </div>

            <ul className="space-y-2.5">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint/20 text-mint">
                    <Check className="h-4 w-4" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            {active ? (
              <div className="rounded-lg border border-mint/40 bg-mint/10 p-4">
                <Badge tone="success">Active</Badge>
                <p className="mt-2 text-sm font-semibold text-slate-200">
                  Premium runs until {until?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} ({daysLeft} day
                  {daysLeft === 1 ? "" : "s"} left). Renewing adds {cfg.premiumDays} more days.
                </p>
              </div>
            ) : null}

            <Button size="lg" className="w-full" disabled={busy} onClick={() => void pay()}>
              {busy ? "Opening payment…" : active ? `Renew for ${formatCurrency(cfg.premiumPrice)}` : `Go Premium for ${formatCurrency(cfg.premiumPrice)}`}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Pay with M-Pesa, Airtel Money, Mixx by Yas or Halotel. Secure checkout by Snippe.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
