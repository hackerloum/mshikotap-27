"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { StatCard } from "@/components/ui/stat";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { toast } from "sonner";
import { Check, Wallet } from "lucide-react";

const packages = [
  { id: "starter", credits: 50000, label: "Starter" },
  { id: "growth", credits: 200000, label: "Growth", popular: true },
  { id: "scale", credits: 500000, label: "Scale" },
  { id: "big", credits: 1000000, label: "Big push" },
];

export default function AdvertiserCreditsPage() {
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState("growth");

  function requestTopUp() {
    const pkg = packages.find((p) => p.id === selected);
    if (!pkg || !user) return;
    const subject = encodeURIComponent(`Credit top-up: ${formatCurrency(pkg.credits)}`);
    const body = encodeURIComponent(`Hi, please top up ${formatCurrency(pkg.credits)} credits for ${user.email}.`);
    window.location.href = `mailto:${siteConfig.supportEmail}?subject=${subject}&body=${body}`;
    toast.success("Opening your email app");
  }

  return (
    <DashboardShell role="advertiser" title="Credits">
      <div className="space-y-6">
        <StatCard
          label="Credit balance"
          value={formatCurrency(user?.advertiserCredits ?? 0)}
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
                  {formatCurrency(pkg.credits)}
                </p>
                <p className="text-sm text-slate-400">in campaign credits</p>
              </button>
            );
          })}
        </div>

        <Button size="lg" className="w-full sm:w-auto" onClick={requestTopUp}>
          Request this top-up
        </Button>
      </div>
    </DashboardShell>
  );
}
