"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Building2, Bitcoin, CreditCard, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat";
import { siteConfig } from "@/config/site";
import { walletService } from "@/services/wallet.service";
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
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("25");
  const [method, setMethod] = useState<WithdrawalMethod>("mobile_money");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await walletService.listWithdrawals(user.uid);
    if (res.ok) setHistory(res.data);
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
      userId: user.uid,
      amount: Number(amount),
      method,
      destination,
      availableBalance: user.wallet.balance,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Cash out requested");
    void load();
  }

  const balance = user?.wallet.balance ?? 0;
  const pending = user?.wallet.pendingBalance ?? 0;
  const canCashOut = balance >= siteConfig.minWithdrawal;
  const remaining = Math.max(0, siteConfig.minWithdrawal - balance);
  const feePreview =
    Number(amount || 0) * (siteConfig.withdrawalFeePercent / 100);
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
                {formatCurrency(Math.min(balance, siteConfig.minWithdrawal))} /{" "}
                {formatCurrency(siteConfig.minWithdrawal)}
              </span>
            </div>
            <ProgressBar
              value={balance}
              max={siteConfig.minWithdrawal}
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
            value={`${siteConfig.withdrawalFeePercent}%`}
            hint={`Min ${formatCurrency(siteConfig.minWithdrawal)}`}
            tone="sky"
            icon={<CreditCard className="h-6 w-6" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card id="cashout" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl">Cash out</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min={siteConfig.minWithdrawal}
                    step="0.01"
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
                    placeholder="Phone, account, or wallet"
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
                  disabled={loading}
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
