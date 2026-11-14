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
import { useConfigStore } from "@/store/config-store";
import { formatCurrency, relativeTime } from "@/lib/utils";

type Tab = "draft" | "active" | "paused" | "completed" | "all";

const tone = { active: "success", paused: "warning", completed: "default", draft: "info", rejected: "danger" } as const;
const label = { active: "running", paused: "paused", completed: "stopped", draft: "waiting", rejected: "not approved" } as const;

export default function AdminCampaignsPage() {
  const [items, setItems] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const share = useConfigStore((c) => c.config.playerSharePercent);
  const [tab, setTab] = useState<Tab>("draft");
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

  async function set(c: AdminCampaign, status: "active" | "paused" | "completed" | "rejected") {
    let reason: string | undefined;
    if (status === "rejected") {
      const answer = window.prompt("Why is this not approved? The advertiser sees this and their money is returned.");
      if (!answer || answer.trim().length < 3) return;
      reason = answer.trim();
    }
    setBusy(true);
    const res = await adminService.setCampaign(c.id, status, reason);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(status === "active" ? "Approved and live" : `Campaign ${status}`);
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
            { id: "draft", label: "To approve", count: items.filter((c) => c.status === "draft").length },
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
                    <Badge tone={tone[c.status]}>{label[c.status]}</Badge>
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
                    {formatCurrency(c.costPerAction)} per action · player gets {formatCurrency(c.playerReward ?? Math.floor((c.costPerAction * share) / 100))}
                  </p>
                  {c.statusReason ? <p className="text-xs font-semibold text-slate-400">Note: {c.statusReason}</p> : null}
                  {c.instructions ? <p className="line-clamp-3 text-xs font-semibold text-slate-300">{c.instructions}</p> : null}
                  {c.targetUrl ? (
                    <a href={c.targetUrl} target="_blank" rel="noreferrer" className="block truncate text-xs font-bold text-sky hover:underline">
                      {c.targetUrl}
                    </a>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    {c.status === "draft" ? (
                      <>
                        <Button size="sm" variant="mint" className="min-h-11" disabled={busy} onClick={() => void set(c, "active")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" className="min-h-11" disabled={busy} onClick={() => void set(c, "rejected")}>
                          Reject
                        </Button>
                      </>
                    ) : (
                      <>
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
                        {c.status === "active" || c.status === "paused" ? (
                          <Button size="sm" variant="danger" className="min-h-11" disabled={busy} onClick={() => void set(c, "completed")}>
                            Stop
                          </Button>
                        ) : null}
                      </>
                    )}
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
