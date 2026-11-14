"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs, PlayerChip, dateTime } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { flagLabels } from "@/config/system";
import { adminService, type AdminFlag } from "@/services/admin.service";
import { relativeTime } from "@/lib/utils";

type Tab = "open" | "confirmed" | "dismissed";

const severityTone = { high: "danger", medium: "warning", low: "default" } as const;

export default function AdminFraudPage() {
  const [tab, setTab] = useState<Tab>("open");
  const [items, setItems] = useState<AdminFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminService.flags(tab);
    if (res.ok) setItems(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const byKind = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((f) => map.set(f.kind, (map.get(f.kind) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  async function resolve(f: AdminFlag, action: "dismiss" | "confirm") {
    setBusy(true);
    const res = await adminService.resolveFlag(f.id, action);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(action === "dismiss" ? "Dismissed. Risk points restored." : "Confirmed");
    void load();
  }

  return (
    <DashboardShell role="admin" title="Fraud alerts">
      <div className="space-y-5">
        <PillTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "open", label: "Open" },
            { id: "confirmed", label: "Confirmed" },
            { id: "dismissed", label: "Dismissed" },
          ]}
        />

        {byKind.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {byKind.map(([kind, count]) => (
              <span key={kind} className="rounded-full bg-ink-800 px-3 py-1.5 text-xs font-extrabold text-slate-300">
                {flagLabels[kind as keyof typeof flagLabels] ?? kind} · {count}
              </span>
            ))}
          </div>
        ) : null}

        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState
            title={tab === "open" ? "No open alerts" : "Nothing here"}
            description="Alerts appear when the system blocks reused proof, rushed claims, shared devices and similar tricks."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((f) => (
              <Card key={f.id} className={f.severity === "high" && f.status === "open" ? "border-coral/60" : undefined}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl text-white">{flagLabels[f.kind] ?? f.kind}</p>
                      <p className="mt-0.5 break-words text-sm font-semibold text-slate-300">{f.detail}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={severityTone[f.severity]}>{f.severity}</Badge>
                      {f.points !== 0 ? <span className="text-xs font-extrabold text-slate-400">{f.points > 0 ? "+" : ""}{f.points} risk</span> : null}
                    </div>
                  </div>
                  <PlayerChip player={f.player} fallback={f.userId} />
                  <p className="text-xs font-semibold text-slate-500">
                    {relativeTime(f.createdAt)} · {dateTime(f.createdAt)}
                  </p>
                  {f.status === "open" ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Button size="sm" variant="secondary" className="min-h-11" disabled={busy} onClick={() => void resolve(f, "dismiss")}>
                        False alarm
                      </Button>
                      <Button size="sm" variant="danger" className="min-h-11" disabled={busy} onClick={() => void resolve(f, "confirm")}>
                        Confirm
                      </Button>
                      <Link
                        href={`/admin/users/${f.userId}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-coin px-3 font-display text-sm text-coin hover:bg-coin/10"
                      >
                        Open player
                      </Link>
                    </div>
                  ) : (
                    <Badge tone={f.status === "confirmed" ? "danger" : "default"}>{f.status}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
