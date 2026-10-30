"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat";
import { siteConfig } from "@/config/site";
import { walletService } from "@/services/wallet.service";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, relativeTime } from "@/lib/utils";
import type { Withdrawal, WithdrawalMethod } from "@/types";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

const methods: WithdrawalMethod[] = [
  "mobile_money",
  "bank_transfer",
  "paypal",
  "crypto",
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
    toast.success("Withdrawal requested");
    void load();
  }

  const feePreview =
    Number(amount || 0) * (siteConfig.withdrawalFeePercent / 100);

  return (
    <DashboardShell role="user" title="Withdraw">
      <div className="space-y-6 animate-rise">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Available"
            value={formatCurrency(user?.wallet.balance ?? 0)}
            hint={`Min ${formatCurrency(siteConfig.minWithdrawal)}`}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            label="Fee"
            value={`${siteConfig.withdrawalFeePercent}%`}
            hint={`Est. fee ${formatCurrency(feePreview)}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Request withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={siteConfig.minWithdrawal}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="method">Method</Label>
                  <select
                    id="method"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-teal-400/50"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as WithdrawalMethod)}
                  >
                    {methods.map((m) => (
                      <option key={m} value={m} className="bg-slate-900">
                        {m.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Phone, account, or wallet"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting…" : "Request payout"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <EmptyState title="No withdrawals yet" />
              ) : (
                history.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {formatCurrency(w.amount)} → {formatCurrency(w.netAmount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {w.method.replaceAll("_", " ")} · {w.destination} ·{" "}
                        {relativeTime(w.createdAt)}
                      </p>
                    </div>
                    <Badge tone={statusTone[w.status]}>{w.status}</Badge>
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
