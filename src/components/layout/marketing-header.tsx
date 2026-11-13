"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/challenges", label: "Races" },
  { href: "/leaderboards", label: "Leaderboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Boosts" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const cta = user
    ? { href: user.role === "admin" ? "/admin" : "/user", label: "My quests" }
    : { href: "/login", label: "Play now" };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink-700 bg-ink-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Brand />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-300 transition hover:bg-ink-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={cta.href} className={cn(buttonVariants({ size: "sm" }), "h-10 px-4")}>
            {cta.label}
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink-600 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t-2 border-ink-700 bg-ink-900 px-4 py-3 lg:hidden">
          <div className="mx-auto grid max-w-6xl gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 font-display text-lg text-white active:bg-ink-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
