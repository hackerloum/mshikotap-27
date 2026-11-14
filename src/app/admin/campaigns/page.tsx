"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { adminService, type AdminCampaign } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";

type Tab = "active" | "paused" | "completed" | "all";

const tone = { active: "success", paused: "warning", completed: "default", draft: "default", rejected: "danger" } as const;

export default function AdminCampaignsPage() {
  const [items, setItems] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminService.campaigns();
    if (res.ok) setItems(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function set(c: AdminCampaign, status: "active" | "paused" | "completed") {
    setBusy(true);
    const res = await adminService.setCampaign(c.id, status);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Campaign ${status}`);
    void load();
  }

  const shown = items.filter((c) => tab === "all" || c.status === tab);

  return (
    <DashboardShell role="admin" title="Campaigns">
      <div className="space-y-5">
        <PillTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "active", label: "Running", count: items.filter((c) => c.status === "active").length },
            { id: "paused", label: "Paused", count: items.filter((c) => c.status === "paused").length },
            { id: "completed", label: "Stopped" },
            { id: "all", label: "All" },
          ]}
        />

        {loading ? (
          <Loading />
        ) : shown.length === 0 ? (
          <EmptyState title="No campaigns here" description="Advertiser campaigns show up here and can be paused at any time." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {shown.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl text-white">{c.title}</p>
                      <p className="text-xs font-semibold text-slate-400">
                        {c.advertiserName} · {c.type.replaceAll("_", " ")} · {relativeTime(c.createdAt)}
                      </p>
                    </div>
                    <Badge tone={tone[c.status]}>{c.status === "completed" ? "stopped" : c.status}</Badge>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-extrabold text-slate-300">
                      <span>
                        Spent {formatCurrency(c.spentCredits)} of {formatCurrency(c.budgetCredits)}
                      </span>
                      <span>{c.completions} done</span>
                    </div>
                    <ProgressBar value={c.spentCredits} max={Math.max(1, c.budgetCredits)} tone="sky" label="Budget used" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    {formatCurrency(c.costPerAction)} per action · player gets {formatCurrency(Math.floor(c.costPerAction * 0.7))}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {c.status === "active" ? (
                      <Button size="sm" variant="secondary" className="min-h-11" disabled={busy} onClick={() => void set(c, "paused")}>
                        Pause
                      </Button>
                    ) : c.status === "paused" ? (
                      <Button size="sm" variant="mint" className="min-h-11" disabled={busy} onClick={() => void set(c, "active")}>
                        Resume
                      </Button>
                    ) : (
                      <span />
                    )}
                    {c.status !== "completed" ? (
                      <Button size="sm" variant="danger" className="min-h-11" disabled={busy} onClick={() => void set(c, "completed")}>
                        Stop
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
