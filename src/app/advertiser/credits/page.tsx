"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { StatCard } from "@/components/ui/stat";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Wallet } from "lucide-react";

const packages = [
  { id: "starter", credits: 100, price: 19, label: "Starter" },
  { id: "growth", credits: 500, price: 79, label: "Growth", popular: true },
  { id: "scale", credits: 1500, price: 199, label: "Scale" },
  { id: "enterprise", credits: 5000, price: 599, label: "Enterprise" },
];

export default function AdvertiserCreditsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [selected, setSelected] = useState("growth");

  function purchase() {
    const pkg = packages.find((p) => p.id === selected);
    if (!pkg || !user) return;
    setUser({
      ...user,
      advertiserCredits: (user.advertiserCredits ?? 0) + pkg.credits,
    });
    toast.success(`Demo purchase: +${pkg.credits} credits`);
  }

  return (
    <DashboardShell role="advertiser" title="Credits">
      <div className="space-y-6">
        <StatCard
          label="Credit balance"
          value={formatNumber(user?.advertiserCredits ?? 0)}
          hint="Spent as people finish your tasks"
          icon={<Wallet className="h-5 w-5" />}
          tone="coin"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => {
            const isSelected = selected === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(pkg.id)}
                className={`rounded-3xl border-2 p-5 text-left transition active:translate-y-[3px] ${
                  isSelected
                    ? "border-coin bg-ink-800 shadow-[0_5px_0_0_var(--color-coin-deep)]"
                    : "border-ink-700 bg-ink-900 shadow-[0_5px_0_0_var(--color-ink-700)] hover:border-ink-600"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl text-white">{pkg.label}</h3>
                  {pkg.popular ? (
                    <Badge tone="brand">Popular</Badge>
                  ) : isSelected ? (
                    <Check className="h-5 w-5 text-coin" />
                  ) : null}
                </div>
                <p className="mt-3 flex items-center gap-2 font-display text-3xl text-white">
                  <Coin size={28} />
                  {formatNumber(pkg.credits)}
                </p>
                <p className="text-sm text-slate-400">credits</p>
                <p className="mt-4 font-display text-xl text-mint">
                  {formatCurrency(pkg.price)}
                </p>
              </button>
            );
          })}
        </div>

        <Button size="lg" className="w-full sm:w-auto" onClick={purchase}>
          Buy selected pack (demo)
        </Button>
      </div>
    </DashboardShell>
  );
}
