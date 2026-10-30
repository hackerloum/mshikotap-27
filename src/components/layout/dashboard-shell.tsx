"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChartNoAxesCombined,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Store,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import type { UserRole } from "@/types";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navByRole: Record<UserRole, NavItem[]> = {
  user: [
    { href: "/user", label: "Overview", icon: LayoutDashboard },
    { href: "/user/tasks", label: "Tasks", icon: Target },
    { href: "/user/withdraw", label: "Withdraw", icon: Wallet },
    { href: "/user/referrals", label: "Referrals", icon: Users },
    { href: "/user/challenges", label: "Challenges", icon: Trophy },
    { href: "/user/marketplace", label: "Marketplace", icon: Store },
    { href: "/user/notifications", label: "Notifications", icon: Bell },
    { href: "/user/settings", label: "Settings", icon: Settings },
  ],
  advertiser: [
    { href: "/advertiser", label: "Overview", icon: LayoutDashboard },
    { href: "/advertiser/campaigns", label: "Campaigns", icon: Flag },
    { href: "/advertiser/credits", label: "Credits", icon: Wallet },
    { href: "/advertiser/analytics", label: "Analytics", icon: ChartNoAxesCombined },
    { href: "/advertiser/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/tasks", label: "Task review", icon: Target },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
    { href: "/admin/challenges", label: "Challenges", icon: Trophy },
    { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

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
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUiStore();
  const items = navByRole[role];

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070d18] text-slate-300">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.12),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.1),_transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1400px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#0a1322]/95 p-4 backdrop-blur-xl transition md:static md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <Brand href={items[0].href} size="sm" />
            <button
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== `/${role === "user" ? "user" : role}` &&
                  pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-teal-400/15 text-teal-200"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
              <Button
                variant="ghost"
                className="mt-2 w-full justify-start px-2"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close overlay"
          />
        ) : null}

        <main className="relative flex-1 px-4 py-4 md:px-8 md:py-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-white/10 p-2 text-slate-300 md:hidden"
                onClick={toggleSidebar}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  {role} dashboard
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
                  {title}
                </h1>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              Demo mode · scalable Firebase-ready
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
