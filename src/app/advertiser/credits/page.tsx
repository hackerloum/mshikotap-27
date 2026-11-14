"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin } from "@/components/ui/coin";
import { Input, Label } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat";
import { paymentsService } from "@/services/payments.service";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import { formatCurrency, relativeTime } from "@/lib/utils";
import type { PaymentRecord } from "@/types";

const packages = [20000, 50000, 100000, 250000];

const tone = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  expired: "default",
  voided: "default",
  mismatch: "danger",
} as const;

export default function AdvertiserCreditsPage() {
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refreshProfile);
  const cfg = useConfigStore((s) => s.config);
  const [amount, setAmount] = useState("50000");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    void refresh();
    void paymentsService.list().then((res) => {
      if (res.ok) setHistory(res.data.filter((p) => p.kind === "topup"));
    });
  }, [refresh]);

  async function pay() {
    const value = Number(amount);
    if (!Number.isInteger(value) || value < cfg.minTopUp || value > cfg.maxTopUp) {
      toast.error(`Enter an amount from ${formatCurrency(cfg.minTopUp)} to ${formatCurrency(cfg.maxTopUp)}`);
      return;
    }
    setBusy(true);
    const res = await paymentsService.checkout("topup", value);
    if (!res.ok) {
      setBusy(false);
      toast.error(res.error.message);
      return;
    }
    window.location.href = res.data.checkoutUrl;
  }

  return (
    <DashboardShell role="advertiser" title="Add money">
      <div className="space-y-6">
        <StatCard
          label="Your balance"
          value={formatCurrency(user?.advertiserCredits ?? 0)}
          hint="Used to fund your quests. Unused money returns when you stop a quest."
          icon={<Wallet className="h-5 w-5" />}
          tone="coin"
        />

        <Card>
          <CardHeader>
            <CardTitle>Add money</CardTitle>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Pay with M-Pesa, Airtel Money, Mixx by Yas or Halotel. You must add money before you can post a quest.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {packages
                .filter((p) => p >= cfg.minTopUp && p <= cfg.maxTopUp)
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={Number(amount) === p}
                    onClick={() => setAmount(String(p))}
                    className={`rounded-2xl border-2 p-4 text-left transition active:translate-y-[2px] ${
                      Number(amount) === p
                        ? "border-coin bg-ink-800 shadow-[0_4px_0_0_var(--color-coin-deep)]"
                        : "border-ink-700 bg-ink-900 hover:border-ink-600"
                    }`}
                  >
                    <Coin size={22} />
                    <p className="mt-2 font-display text-xl text-white">{formatCurrency(p)}</p>
                  </button>
                ))}
            </div>
            <div className="max-w-xs">
              <Label htmlFor="amt">Or type an amount (TSh)</Label>
              <Input id="amt" type="number" inputMode="numeric" min={cfg.minTopUp} max={cfg.maxTopUp} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <Button size="lg" className="w-full sm:w-auto" disabled={busy} onClick={() => void pay()}>
              {busy ? "Opening payment…" : `Pay ${formatCurrency(Number(amount) || 0)}`}
            </Button>
          </CardContent>
        </Card>

        {history.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-ink-800 px-4 py-3">
                  <div>
                    <p className="font-display text-lg text-white">{formatCurrency(p.amount)}</p>
                    <p className="text-xs font-semibold text-slate-400">{relativeTime(p.createdAt)}</p>
                  </div>
                  <Badge tone={tone[p.status]}>{p.status === "completed" ? "paid" : p.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardShell>
  );
}
