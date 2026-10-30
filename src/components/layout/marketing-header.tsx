"use client";

import Link from "next/link";
import { Brand } from "@/components/layout/brand";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/leaderboards", label: "Leaderboards" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07111f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-11 items-center rounded-xl px-4 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 px-5 text-sm font-medium text-slate-950 shadow-[0_0_24px_rgba(45,212,191,0.25)] transition hover:brightness-110"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
