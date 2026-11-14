"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Building2, Bitcoin, Check, CreditCard, Lock, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat";
import { walletService, type Eligibility } from "@/services/wallet.service";
import { useConfigStore } from "@/store/config-store";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";
import type { Withdrawal, WithdrawalMethod } from "@/types";
import { toast } from "sonner";

const methods: Array<{
  id: WithdrawalMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "mobile_money", label: "Mobile money", icon: Smartphone },
  { id: "bank_transfer", label: "Bank", icon: Building2 },
  { id: "paypal", label: "PayPal", icon: CreditCard },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
];

const statusTone = {
  pending: "warning",
  under_review: "info",
  approved: "brand",
  processing: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "default",
} as const;

export default function UserWithdrawPage() {
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const config = useConfigStore((c) => c.config);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("mobile_money");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [res, gate] = await Promise.all([walletService.listWithdrawals(), walletService.eligibility()]);
    if (res.ok) setHistory(res.data);
    if (gate.ok) setEligibility(gate.data);
  }, [user]);

  useEffect(() => {
    void load();
    if (user?.phone) setDestination(user.phone);
  }, [load, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const res = await walletService.requestWithdrawal({
      amount: Number(amount),
      method,
      destination,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Cash out requested");
    void load();
    void refreshProfile();
  }

  const balance = user?.wallet.balance ?? 0;
  const pending = user?.wallet.pendingBalance ?? 0;
  const canCashOut = balance >= config.minWithdrawal;
  const remaining = Math.max(0, config.minWithdrawal - balance);
  const feePreview = Math.round(
    Number(amount || 0) * (config.withdrawalFeePercent / 100),
  );
  const netPreview = Math.max(0, Number(amount || 0) - feePreview);

  return (
    <DashboardShell role="user" title="Wallet">
      <div className="space-y-6">
        <section className="dots relative overflow-hidden rounded-3xl border-2 border-coin-deep bg-coin p-5 text-ink-950 shadow-[0_6px_0_0_var(--color-coin-deep)] sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-ink-950/70">
                Your stash
              </p>
              <p className="mt-1 truncate font-display text-5xl leading-none sm:text-6xl">
                {formatCurrency(balance)}
              </p>
              {pending > 0 ? (
                <p className="mt-2 text-sm font-extrabold text-ink-950/70">
                  + {formatCurrency(pending)} on the way
                </p>
              ) : null}
            </div>
            <Coin size={64} className="animate-bob" />
          </div>

          <div className="mt-5 rounded-2xl bg-ink-950 p-4 text-white">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider">
              <span className="text-slate-400">
                {canCashOut ? "Ready to cash out" : "Next cash out"}
              </span>
              <span className={canCashOut ? "text-mint" : "text-coin"}>
                {formatCurrency(Math.min(balance, config.minWithdrawal))} /{" "}
                {formatCurrency(config.minWithdrawal)}
              </span>
            </div>
            <ProgressBar
              value={balance}
              max={config.minWithdrawal}
              tone={canCashOut ? "mint" : "coin"}
              label="Progress toward minimum cash out"
            />
            <p className="mt-2 text-sm text-slate-300">
              {canCashOut
                ? "Your stash is ready. Time to cash out!"
                : `Earn ${formatCurrency(remaining)} more to unlock your first cash out.`}
            </p>
          </div>

          <a
            href="#cashout"
            className={cn(
              buttonVariants({ variant: "mint", size: "lg" }),
              "mt-5 w-full sm:w-auto",
            )}
          >
            <Banknote className="h-5 w-5" />
            Cash out
          </a>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Lifetime earned"
            value={formatCurrency(user?.wallet.lifetimeEarnings ?? 0)}
            tone="mint"
            icon={<Banknote className="h-6 w-6" />}
          />
          <StatCard
            label="Cash out fee"
            value={`${config.withdrawalFeePercent}%`}
            hint={`Min ${formatCurrency(config.minWithdrawal)}`}
            tone="sky"
            icon={<CreditCard className="h-6 w-6" />}
          />
        </div>

        {eligibility && !eligibility.canWithdraw ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Lock className="h-5 w-5 text-coin" /> Unlock cash out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eligibility.checks.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                        c.ok ? "bg-mint text-ink-950" : "bg-ink-700 text-slate-400",
                      )}
                    >
                      {c.ok ? <Check className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                    </span>
                    <span className="truncate">{c.label}</span>
                  </span>
                  <span className={cn("shrink-0 text-xs font-extrabold", c.ok ? "text-mint" : "text-slate-400")}>
                    {c.detail}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-xs font-semibold text-slate-500">
                These checks keep the game fair for everyone and protect your earnings.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card id="cashout" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl">Cash out</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <Label htmlFor="amount">Amount (TSh)</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min={config.minWithdrawal}
                    placeholder={String(config.minWithdrawal)}
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <p className="mt-2 text-sm text-slate-400">
                    Fee {formatCurrency(feePreview)} · You get{" "}
                    <span className="font-extrabold text-mint">
                      {formatCurrency(netPreview)}
                    </span>
                  </p>
                </div>

                <div>
                  <Label>Pay me via</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {methods.map((m) => {
                      const Icon = m.icon;
                      const active = method === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setMethod(m.id)}
                          className={cn(
                            "flex min-h-12 items-center gap-2 rounded-2xl border-2 px-3 text-left text-sm font-extrabold transition active:translate-y-px",
                            active
                              ? "border-coin bg-coin/15 text-coin"
                              : "border-ink-700 bg-ink-950 text-slate-300 hover:border-ink-600",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="destination">Where to send it</Label>
                  <Input
                    id="destination"
                    placeholder={method === "mobile_money" ? "0712 345 678" : "Account or wallet"}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="mint"
                  size="lg"
                  className="w-full"
                  disabled={loading || (eligibility ? !eligibility.canWithdraw : false)}
                >
                  {loading ? "Sending…" : "Cash out now"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Payout history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <EmptyState
                  title="No cash outs yet"
                  description="Your first payout will show up here."
                />
              ) : (
                history.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-2xl border-2 border-ink-700 bg-ink-800 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-xl text-white">
                        {formatCurrency(w.netAmount)}
                        <span className="ml-2 text-sm text-slate-400">
                          of {formatCurrency(w.amount)}
                        </span>
                      </p>
                      <Badge tone={statusTone[w.status]}>
                        {w.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 break-words text-xs font-semibold text-slate-400">
                      {w.method.replaceAll("_", " ")} · {w.destination} ·{" "}
                      {relativeTime(w.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
