"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs, RiskBadge } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { adminService, type AdminUser } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";

type Tab = "all" | "risky" | "banned" | "advertisers";

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const load = useCallback(async () => {
    const res = await adminService.users();
    if (res.ok) setRows(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      risky: rows.filter((r) => r.risk !== "low" && !r.trusted).length,
      banned: rows.filter((r) => r.isBanned).length,
      advertisers: rows.filter((r) => r.role === "advertiser").length,
    }),
    [rows],
  );

  const filtered = rows
    .filter((r) => {
      if (tab === "risky") return r.risk !== "low" && !r.trusted;
      if (tab === "banned") return r.isBanned;
      if (tab === "advertisers") return r.role === "advertiser";
      return true;
    })
    .filter((r) => {
      const q = query.trim().toLowerCase();
      return !q || r.displayName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    });

  return (
    <DashboardShell role="admin" title="Players">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <PillTabs
            value={tab}
            onChange={setTab}
            options={[
              { id: "all", label: "Everyone", count: rows.length },
              { id: "risky", label: "Risky", count: counts.risky },
              { id: "banned", label: "Suspended", count: counts.banned },
              { id: "advertisers", label: "Advertisers", count: counts.advertisers },
            ]}
          />
          <Input
            className="md:max-w-xs"
            placeholder="Search by name or email"
            aria-label="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <Loading label="Loading players…" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No players found" description="New players show up here as soon as they sign in with Google." />
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {filtered.map((r) => (
                <Link key={r.uid} href={`/admin/users/${r.uid}`} className="block">
                  <Card>
                    <CardContent className="space-y-2 pt-5">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base text-white">{r.displayName}</p>
                        <p className="truncate text-xs text-slate-400">{r.email}</p>
                      </div>
                      <div className="tabular flex flex-wrap gap-2">
                        <Badge>{r.role}</Badge>
                        <Badge tone="info">LV {r.level}</Badge>
                        <Badge tone="brand">{formatCurrency(r.balance)}</Badge>
                        <RiskBadge risk={r.risk} score={r.riskScore} trusted={r.trusted} />
                        {r.isBanned ? <Badge tone="danger">suspended</Badge> : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-ink-700/80 bg-ink-900 md:block">
              <table className="tabular w-full min-w-[860px] text-left text-sm">
                <thead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr className="border-b border-ink-700/80">
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Approved</th>
                    <th className="px-4 py-3 font-semibold">Risk</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700/60">
                  {filtered.map((r) => (
                    <tr key={r.uid} className="hover:bg-ink-800/60">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/users/${r.uid}`} className="block">
                          <p className="font-semibold text-white hover:text-coin">{r.displayName}</p>
                          <p className="text-xs text-slate-400">{r.email}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge>{r.role}</Badge>
                        {r.role === "advertiser" ? (
                          <p className="mt-1 text-xs text-slate-400">Credits {formatCurrency(r.advertiserCredits)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-coin">{formatCurrency(r.balance)}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-200">{r.approved}</td>
                      <td className="px-4 py-2.5">
                        <RiskBadge risk={r.risk} score={r.riskScore} trusted={r.trusted} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{relativeTime(r.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={r.isBanned ? "danger" : "success"}>{r.isBanned ? "suspended" : "active"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
