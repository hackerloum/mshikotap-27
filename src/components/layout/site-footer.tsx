import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { siteConfig } from "@/config/site";

const cols = [
  {
    title: "Play",
    links: [
      { href: "/login", label: "Start earning" },
      { href: "/challenges", label: "Races" },
      { href: "/leaderboards", label: "Leaderboard" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/pricing", label: "Boost plans" },
      { href: "/#how", label: "How it works" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink-700 bg-ink-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            Quick quests, real payouts. Made in Tanzania for players across East
            Africa.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <p className="font-display text-lg text-white">{col.title}</p>
            <ul className="mt-2 space-y-1.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-slate-400 hover:text-coin"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-ink-800 px-4 py-4 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} {siteConfig.name} · {siteConfig.supportEmail}
      </div>
    </footer>
  );
}
