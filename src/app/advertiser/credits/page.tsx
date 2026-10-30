"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

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
      <div className="space-y-6 animate-rise">
        <StatCard
          label="Credit balance"
          value={formatNumber(user?.advertiserCredits ?? 0)}
          hint="Used for campaign actions"
          icon={<Wallet className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={
                selected === pkg.id
                  ? "border-teal-400/40 ring-1 ring-teal-400/30"
                  : "cursor-pointer"
              }
              onClick={() => setSelected(pkg.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{pkg.label}</CardTitle>
                  {pkg.popular ? <Badge tone="brand">Popular</Badge> : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">
                  {formatNumber(pkg.credits)}
                </p>
                <p className="mt-1 text-sm text-slate-400">credits</p>
                <p className="mt-4 text-lg text-teal-200">
                  {formatCurrency(pkg.price)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={purchase}>Purchase selected (demo)</Button>
      </div>
    </DashboardShell>
  );
}
