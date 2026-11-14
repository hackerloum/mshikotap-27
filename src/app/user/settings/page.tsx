"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Star } from "@/components/ui/coin";
import { StatCard } from "@/components/ui/stat";
import { subscriptionTiers } from "@/config/subscriptions";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function UserSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const plan = subscriptionTiers.find((t) => t.id === user?.subscription);

  const initial = (user?.displayName || "P").charAt(0).toUpperCase();

  async function signOut() {
    await logout();
    router.push("/");
  }

  return (
    <DashboardShell role="user" title="Profile">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="h-[72px] w-[72px] shrink-0 rounded-3xl border-2 border-coin object-cover"
              />
            ) : (
              <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-3xl border-2 border-coin-deep bg-coin font-display text-4xl text-ink-950">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-display text-3xl leading-tight text-white">
                {user?.displayName ?? "Player"}
              </h2>
              <p className="truncate text-sm font-semibold text-slate-400">
                {user?.email}
              </p>
              <Badge tone="info" className="mt-2">
                Signed in with Google
              </Badge>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Level"
            value={String(user?.gamification.level ?? 1)}
            hint={`${formatNumber(user?.gamification.xp ?? 0)} XP`}
            tone="sky"
            icon={<Star size={28} />}
          />
          <StatCard
            label="Streak"
            value={`${user?.gamification.streakDays ?? 0} days`}
            hint={`Best ${user?.gamification.longestStreak ?? 0}`}
            tone="flame"
            icon={<Flame size={28} />}
          />
          <StatCard
            label="Plan"
            value={plan?.name ?? "Free"}
            hint={
              plan ? `${formatCurrency(plan.priceMonthly)}/mo` : undefined
            }
            tone="coin"
          />
        </div>

        {(user?.gamification.badges ?? []).length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Your badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(user?.gamification.badges ?? []).map((b) => (
                <Badge key={b} tone="brand">
                  {b.replaceAll("_", " ")}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Button
          variant="danger"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => void signOut()}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </DashboardShell>
  );
}
