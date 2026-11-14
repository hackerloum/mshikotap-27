"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Crown,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  Flag,
  Home,
  LogOut,
  Sparkles,
  Loader2,
  MoreHorizontal,
  ScrollText,
  Settings,
  ShieldAlert,
  Store,
  Swords,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Coin, Flame, Star } from "@/components/ui/coin";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import type { UserRole } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navByRole: Record<UserRole, NavItem[]> = {
  user: [
    { href: "/user", label: "Home", icon: Home },
    { href: "/user/tasks", label: "Quests", icon: Target },
    { href: "/user/challenges", label: "Races", icon: Swords },
    { href: "/user/withdraw", label: "Wallet", icon: Wallet },
    { href: "/user/referrals", label: "Squad", icon: Users },
    { href: "/user/premium", label: "Premium", icon: Crown },
    { href: "/user/marketplace", label: "Market", icon: Store },
    { href: "/leaderboards", label: "Ranks", icon: Trophy },
    { href: "/user/notifications", label: "Alerts", icon: Bell },
    { href: "/user/settings", label: "Profile", icon: Settings },
  ],
  advertiser: [
    { href: "/advertiser", label: "Home", icon: Home },
    { href: "/advertiser/campaigns", label: "Campaigns", icon: Flag },
    { href: "/advertiser/credits", label: "Credits", icon: Wallet },
    { href: "/advertiser/analytics", label: "Stats", icon: ChartNoAxesCombined },
    { href: "/advertiser/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/admin/reviews", label: "Reviews", icon: ClipboardCheck },
    { href: "/admin/withdrawals", label: "Payouts", icon: Wallet },
    { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert },
    { href: "/admin/assistant", label: "AI Manager", icon: Sparkles },
    { href: "/admin/users", label: "Players", icon: Users },
    { href: "/admin/tasks", label: "Quests", icon: Target },
    { href: "/admin/campaigns", label: "Campaigns", icon: Flag },
    { href: "/admin/payments", label: "Money", icon: CircleDollarSign },
    { href: "/admin/challenges", label: "Races", icon: Trophy },
    { href: "/admin/analytics", label: "Stats", icon: ChartNoAxesCombined },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

const BOTTOM_COUNT = 4;

function isActive(pathname: string, href: string, root: string) {
  return pathname === href || (href !== root && pathname.startsWith(href));
}

export function DashboardShell({
  role,
  title,
  children,
}: {
  role: UserRole;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuthGuard([role]);
  const logout = useAuthStore((s) => s.logout);
  const announcement = useConfigStore((c) => c.config.announcement);
  const [moreOpen, setMoreOpen] = useState(false);
  const items = navByRole[role];
  const width = role === "admin" ? "max-w-7xl" : "max-w-5xl";
  const root = items[0].href;
  const bottom = items.slice(0, BOTTOM_COUNT);
  const overflow = items.slice(BOTTOM_COUNT);

  if (!ready || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-coin" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  const initial = (user.displayName || "P").charAt(0).toUpperCase();

  return (
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-700/80 bg-ink-900 p-4 lg:flex">
        <Brand href={root} size="sm" className="mb-6 px-1" />
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = isActive(pathname, item.href, root);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-coin/10 text-coin"
                    : "text-slate-300 hover:bg-ink-800 hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-700/80 bg-ink-800 p-3">
          <Avatar url={user.photoURL} initial={initial} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-ink-700/80 bg-ink-950/95 backdrop-blur">
          <div className={cn("mx-auto flex h-16 items-center justify-between gap-3 px-4", width)}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="lg:hidden">
                <Avatar url={user.photoURL} initial={initial} />
              </span>
              <h1 className="truncate font-display text-xl text-white">{title}</h1>
            </div>
            {role === "user" ? (
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Chip className="hidden sm:inline-flex">
                  <Star size={16} />
                  <span className="tabular">Level {user.gamification.level}</span>
                </Chip>
                <Chip>
                  <Flame size={18} />
                  <span className="tabular">{user.gamification.streakDays}d</span>
                </Chip>
                <Chip className="text-coin">
                  <Coin size={18} />
                  <span className="tabular">{formatCurrency(user.wallet.balance)}</span>
                </Chip>
              </div>
            ) : (
              <span className="rounded-md bg-ink-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                {role}
              </span>
            )}
          </div>
        </header>

        {announcement && role !== "admin" ? (
          <div className="border-b border-flame/30 bg-flame/10 px-4 py-2.5 text-center text-sm font-semibold text-flame">
            {announcement}
          </div>
        ) : null}

        <main className={cn("mx-auto px-4 pb-28 pt-5 lg:pb-10", width)}>{children}</main>
      </div>

      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ink-700/80 bg-ink-900 lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {bottom.map((item) => {
            const active = isActive(pathname, item.href, root);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                    active ? "text-coin" : "text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-12 place-items-center rounded-lg transition",
                      active && "bg-coin/15",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-slate-400"
            >
              <span className="grid h-8 w-12 place-items-center">
                <MoreHorizontal className="h-5 w-5" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="pb-safe absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-ink-600 bg-ink-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl text-white">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg bg-ink-800 text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {overflow.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-2 py-4 text-sm font-semibold text-white"
                  >
                    <Icon className="h-6 w-6 text-coin" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={signOut}
                className="flex flex-col items-center gap-2 rounded-xl border border-coral/40 bg-coral/10 px-2 py-4 text-sm font-semibold text-coral"
              >
                <LogOut className="h-6 w-6" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-2.5 text-sm font-semibold text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Avatar({ url, initial }: { url?: string; initial: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      className="h-10 w-10 shrink-0 rounded-full border border-ink-600 object-cover"
    />
  ) : (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky font-display text-base text-ink-950">
      {initial}
    </span>
  );
}
