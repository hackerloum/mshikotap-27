"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs, dateTime } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { adminService, type AuditRow } from "@/services/admin.service";

type Tab = "all" | "submission" | "withdrawal" | "user" | "settings" | "other";

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void adminService.audit().then((res) => {
      if (res.ok) setRows(res.data);
      else toast.error(res.error.message);
      setLoading(false);
    });
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (tab === "all") return true;
        if (tab === "other") return !["submission", "withdrawal", "user", "settings"].includes(r.entityType);
        return r.entityType === tab;
      })
      .filter((r) => !q || r.summary.toLowerCase().includes(q) || r.actorName.toLowerCase().includes(q));
  }, [rows, tab, query]);

  return (
    <DashboardShell role="admin" title="Audit log">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <PillTabs
            value={tab}
            onChange={setTab}
            options={[
              { id: "all", label: "Everything" },
              { id: "submission", label: "Reviews" },
              { id: "withdrawal", label: "Payouts" },
              { id: "user", label: "Players" },
              { id: "settings", label: "Settings" },
              { id: "other", label: "Other" },
            ]}
          />
          <Input className="md:max-w-xs" aria-label="Search audit log" placeholder="Search actions" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {loading ? (
          <Loading />
        ) : shown.length === 0 ? (
          <EmptyState title="No activity" description="Every admin action is recorded here with who did it and when." />
        ) : (
          <div className="space-y-2">
            {shown.map((r) => (
              <div key={r.id} className="rounded-2xl border-2 border-ink-700 bg-ink-900 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg text-coin">{r.actorName}</span>
                    <Badge>{r.action}</Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{dateTime(r.createdAt)}</span>
                </div>
                <p className="mt-1 break-words text-sm font-semibold text-slate-200">{r.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
