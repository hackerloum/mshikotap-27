"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { adminService, type AdminUser } from "@/services/admin.service";
import { formatCurrency } from "@/lib/utils";

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const res = await adminService.users();
    if (res.ok) setRows(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter(
    (r) =>
      r.displayName.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase()),
  );

  async function patch(
    row: AdminUser,
    change: { isBanned?: boolean; role?: "user" | "advertiser"; grantCredits?: number },
    message: string,
  ) {
    const res = await adminService.updateUser(row.uid, change);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(message);
    void load();
  }

  function grant(row: AdminUser) {
    const input = window.prompt(`Add credits for ${row.displayName} (TSh)`, "50000");
    const value = Number(input);
    if (!input || !Number.isFinite(value) || value === 0) return;
    void patch(row, { grantCredits: value }, `Added ${formatCurrency(value)} credits`);
  }

  function Actions({ r }: { r: AdminUser }) {
    if (r.role === "admin") return <span className="text-xs font-bold text-slate-500">Managed by ADMIN_EMAILS</span>;
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="min-h-11"
          variant={r.isBanned ? "mint" : "danger"}
          onClick={() => void patch(r, { isBanned: !r.isBanned }, r.isBanned ? `Unbanned ${r.displayName}` : `Banned ${r.displayName}`)}
        >
          {r.isBanned ? "Unban" : "Ban"}
        </Button>
        <Button
          size="sm"
          className="min-h-11"
          variant="secondary"
          onClick={() =>
            void patch(
              r,
              { role: r.role === "advertiser" ? "user" : "advertiser" },
              r.role === "advertiser" ? "Back to player" : "Now an advertiser",
            )
          }
        >
          {r.role === "advertiser" ? "Make player" : "Make advertiser"}
        </Button>
        {r.role === "advertiser" ? (
          <Button size="sm" className="min-h-11" variant="sky" onClick={() => grant(r)}>
            Add credits
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <DashboardShell role="admin" title="Players">
      <div className="space-y-6">
        <Input
          placeholder="Search by name or email"
          aria-label="Search players"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Directory ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm font-semibold text-slate-400">Loading players…</p>
            ) : filtered.length === 0 ? (
              <EmptyState title="No players found" description="New players show up here as soon as they sign in with Google." />
            ) : null}

            <div className="space-y-3 md:hidden">
              {filtered.map((r) => (
                <div key={r.uid} className="space-y-3 rounded-2xl border-2 border-ink-700 bg-ink-800 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg text-white">{r.displayName}</p>
                    <p className="truncate text-xs text-slate-400">{r.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{r.role}</Badge>
                    <Badge tone="info">LV {r.level}</Badge>
                    <Badge tone="brand">{formatCurrency(r.balance)}</Badge>
                    <Badge tone={r.isBanned ? "danger" : "success"}>{r.isBanned ? "banned" : "active"}</Badge>
                  </div>
                  <Actions r={r} />
                </div>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-400">
                    <tr className="border-b-2 border-ink-700">
                      <th className="pb-3 font-extrabold">Player</th>
                      <th className="pb-3 font-extrabold">Role</th>
                      <th className="pb-3 font-extrabold">Balance</th>
                      <th className="pb-3 font-extrabold">Status</th>
                      <th className="pb-3 font-extrabold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-ink-800">
                    {filtered.map((r) => (
                      <tr key={r.uid}>
                        <td className="py-3">
                          <p className="font-bold text-white">{r.displayName}</p>
                          <p className="text-xs text-slate-400">{r.email}</p>
                        </td>
                        <td className="py-3">
                          <Badge>{r.role}</Badge>
                          {r.role === "advertiser" ? (
                            <p className="mt-1 text-xs font-bold text-slate-400">Credits {formatCurrency(r.advertiserCredits)}</p>
                          ) : null}
                        </td>
                        <td className="py-3 font-bold text-coin">{formatCurrency(r.balance)}</td>
                        <td className="py-3">
                          <Badge tone={r.isBanned ? "danger" : "success"}>{r.isBanned ? "banned" : "active"}</Badge>
                        </td>
                        <td className="py-3">
                          <Actions r={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
