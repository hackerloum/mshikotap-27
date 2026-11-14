"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs, PlayerChip, dateTime } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select } from "@/components/ui/input";
import { adminService, type AdminWithdrawal } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";
import type { WithdrawalStatus } from "@/types";

const statusTone = {
  pending: "warning",
  under_review: "info",
  approved: "brand",
  processing: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "default",
} as const;

const open: WithdrawalStatus[] = ["pending", "under_review", "approved", "processing"];
const reasons = [
  "Payout number could not be verified",
  "Account is under review for suspicious activity",
  "Wrong or unreachable payout details",
  "Amount does not match your earnings",
];

type Tab = "waiting" | "done" | "all";

export default function AdminPayoutsPage() {
  const [items, setItems] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("waiting");
  const [query, setQuery] = useState("");
  const [rejecting, setRejecting] = useState<AdminWithdrawal | null>(null);
  const [reason, setReason] = useState(reasons[0]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminService.withdrawals();
    if (res.ok) setItems(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(w: AdminWithdrawal, status: WithdrawalStatus, notes?: string) {
    setBusy(true);
    const res = await adminService.setWithdrawal(w.id, status, notes);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return false;
    }
    toast.success(`Marked ${status.replaceAll("_", " ")}`);
    void load();
    return true;
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  const waiting = items.filter((w) => open.includes(w.status));
  const q = query.trim().toLowerCase();
  const list = (tab === "waiting" ? waiting : tab === "done" ? items.filter((w) => !open.includes(w.status)) : items).filter(
    (w) =>
      !q ||
      w.destination.toLowerCase().includes(q) ||
      (w.player?.name ?? "").toLowerCase().includes(q) ||
      (w.player?.email ?? "").toLowerCase().includes(q),
  );
  const queueTotal = waiting.reduce((sum, w) => sum + w.netAmount, 0);

  return (
    <DashboardShell role="admin" title="Payouts">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <PillTabs
            value={tab}
            onChange={setTab}
            options={[
              { id: "waiting", label: "Waiting", count: waiting.length },
              { id: "done", label: "Finished" },
              { id: "all", label: "All" },
            ]}
          />
          <Input
            className="md:max-w-xs"
            aria-label="Search payouts"
            placeholder="Search player or number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {tab === "waiting" && waiting.length > 0 ? (
          <p className="rounded-2xl border-2 border-coin/30 bg-coin/10 px-4 py-3 text-sm font-extrabold text-coin">
            {waiting.length} payout{waiting.length > 1 ? "s" : ""} waiting · send {formatCurrency(queueTotal)} in total (after fees)
          </p>
        ) : null}

        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <EmptyState title="No payouts here" description="New cash out requests show up as players send them." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {list.map((w) => {
              const active = open.includes(w.status);
              const warn = w.status === "under_review" || w.player?.risk === "high" || w.player?.isBanned;
              return (
                <Card key={w.id} className={warn && active ? "border-flame/60" : undefined}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle>
                        {formatCurrency(w.netAmount)}{" "}
                        <span className="text-sm text-slate-400">of {formatCurrency(w.amount)} · fee {formatCurrency(w.fee)}</span>
                      </CardTitle>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {w.method.replaceAll("_", " ")} · {relativeTime(w.createdAt)}
                        {w.processedAt ? ` · updated ${dateTime(w.processedAt)}` : ""}
                      </p>
                    </div>
                    <Badge tone={statusTone[w.status]}>{w.status.replaceAll("_", " ")}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <PlayerChip player={w.player} />
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-ink-800 px-3 py-2.5">
                      <span className="min-w-0 truncate font-display text-lg text-white">{w.destination}</span>
                      <button
                        onClick={() => void copy(w.destination)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-700 text-slate-200 hover:bg-ink-600"
                        aria-label="Copy payout destination"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {w.notes ? <p className="text-sm font-bold text-flame">{w.notes}</p> : null}

                    {active ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Button size="sm" variant="secondary" className="min-h-11" disabled={busy || w.status === "under_review"} onClick={() => void update(w, "under_review", "Held for review")}>
                          Hold
                        </Button>
                        <Button size="sm" variant="sky" className="min-h-11" disabled={busy || w.status === "approved"} onClick={() => void update(w, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="mint" className="min-h-11" disabled={busy} onClick={() => void update(w, "completed")}>
                          Mark paid
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="min-h-11"
                          disabled={busy}
                          onClick={() => {
                            setRejecting(w);
                            setReason(reasons[0]);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Reject payout">
          <div className="w-full max-w-lg space-y-4 rounded-t-3xl border-2 border-ink-600 bg-ink-900 p-5 sm:rounded-3xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-coral">Reject payout</p>
              <h2 className="font-display text-2xl text-white">{formatCurrency(rejecting.amount)} back to the wallet</h2>
              <p className="text-sm font-semibold text-slate-400">The full amount is refunded to {rejecting.player?.name ?? "the player"}.</p>
            </div>
            <div>
              <Label htmlFor="why">Reason the player will see</Label>
              <Select id="why" value={reason} onChange={(e) => setReason(e.target.value)}>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="min-h-12" onClick={() => setRejecting(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="min-h-12"
                disabled={busy}
                onClick={async () => {
                  if (await update(rejecting, "rejected", reason)) setRejecting(null);
                }}
              >
                Reject and refund
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
