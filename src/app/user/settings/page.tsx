"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, LogOut, Megaphone } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Star } from "@/components/ui/coin";
import { StatCard } from "@/components/ui/stat";
import { paymentsService } from "@/services/payments.service";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/lib/utils";

export default function UserSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refreshProfile);
  const premium = Boolean(user?.subscription === "premium" && user.premiumUntil && new Date(user.premiumUntil).getTime() > Date.now());

  const initial = (user?.displayName || "P").charAt(0).toUpperCase();

  async function signOut() {
    await logout();
    router.push("/");
  }

  async function becomeAdvertiser() {
    const res = await paymentsService.setRole("advertiser");
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    await refresh();
    router.push("/advertiser");
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
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 shrink-0 rounded-full border border-ink-600 object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-sky font-display text-3xl text-ink-950">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl leading-tight text-white">
                {user?.displayName ?? "Player"}
              </h2>
              <p className="truncate text-sm text-slate-400">
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
            icon={<Star size={22} />}
          />
          <StatCard
            label="Streak"
            value={`${user?.gamification.streakDays ?? 0} days`}
            hint={`Best ${user?.gamification.longestStreak ?? 0}`}
            tone="flame"
            icon={<Flame size={22} />}
          />
          <StatCard
            label="Plan"
            value={premium ? "Premium" : "Free"}
            hint={premium && user?.premiumUntil ? `Until ${user.premiumUntil.slice(0, 10)}` : "Upgrade for bigger limits"}
            tone="coin"
            icon={<Crown className="h-5 w-5" />}
          />
        </div>

        {(user?.gamification.badges ?? []).length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your badges</CardTitle>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <Crown className="h-6 w-6 text-coin" />
            <h3 className="mt-2 font-display text-2xl text-white">{premium ? "Premium member" : "Go Premium"}</h3>
            <p className="mt-1 text-sm text-slate-400">Bigger daily bonus and higher daily limits.</p>
            <Link href="/user/premium" className="mt-4 block">
              <Button variant="secondary" className="w-full">
                {premium ? "Renew" : "See Premium"}
              </Button>
            </Link>
          </Card>
          <Card className="p-5">
            <Megaphone className="h-6 w-6 text-sky" />
            <h3 className="mt-2 font-display text-2xl text-white">Promote your business</h3>
            <p className="mt-1 text-sm text-slate-400">Add money, post quests and let players promote you.</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => void becomeAdvertiser()}>
              Open advertiser panel
            </Button>
          </Card>
        </div>

        <Button
          variant="danger"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => void signOut()}
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </DashboardShell>
  );
}
