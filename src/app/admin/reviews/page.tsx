"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs, PlayerChip, ProofLink, dateTime } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { adminService, type AdminSubmission } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";

type Tab = "submitted" | "approved" | "rejected";

const presets = [
  "Proof is blurry or unreadable",
  "Proof does not show the required action",
  "Proof was already used",
  "Fake or edited screenshot",
  "You did not finish all the steps",
];

const tone = { submitted: "warning", approved: "success", rejected: "danger" } as const;

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<Tab>("submitted");
  const [items, setItems] = useState<AdminSubmission[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<AdminSubmission | null>(null);
  const [preset, setPreset] = useState(presets[0]);
  const [custom, setCustom] = useState("");
  const [fraud, setFraud] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, pending] = await Promise.all([adminService.submissions(tab), adminService.submissions("submitted")]);
    if (res.ok) setItems(res.data);
    else toast.error(res.error.message);
    if (pending.ok) setPendingCount(pending.data.length);
    setSelected(new Set());
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) =>
        (s.taskTitle ?? "").toLowerCase().includes(q) ||
        (s.userName ?? "").toLowerCase().includes(q) ||
        (s.player?.email ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  async function approve(ids: string[]) {
    setBusy(true);
    let failed = 0;
    for (const id of ids) {
      const res = await adminService.review(id, "approved");
      if (!res.ok) {
        failed += 1;
        toast.error(res.error.message);
      }
    }
    setBusy(false);
    if (ids.length > failed) toast.success(`Approved ${ids.length - failed}`);
    void load();
  }

  async function reject() {
    if (!rejecting) return;
    const reason = custom.trim() || preset;
    setBusy(true);
    const res = await adminService.review(rejecting.id, "rejected", reason, fraud);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(fraud ? "Rejected and flagged as fraud" : "Rejected");
    setRejecting(null);
    setCustom("");
    setFraud(false);
    void load();
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <DashboardShell role="admin" title="Quest reviews">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <PillTabs
            value={tab}
            onChange={setTab}
            options={[
              { id: "submitted", label: "Waiting", count: pendingCount },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ]}
          />
          <Input
            className="md:max-w-xs"
            aria-label="Search reviews"
            placeholder="Search quest or player"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {tab === "submitted" && selected.size > 0 ? (
          <div className="sticky top-[72px] z-10 flex items-center justify-between gap-3 rounded-2xl border-2 border-mint/50 bg-ink-900 p-3 shadow-lg">
            <p className="text-sm font-extrabold text-white">{selected.size} selected</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="min-h-11" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
              <Button size="sm" variant="mint" className="min-h-11" disabled={busy} onClick={() => void approve([...selected])}>
                Approve selected
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === "submitted" ? "Queue is clear" : "Nothing here yet"}
            description={tab === "submitted" ? "New quest submissions land here as players send proof." : undefined}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((s) => {
              const risky = s.player && (s.player.risk === "high" || s.player.isBanned);
              return (
                <Card key={s.id} className={risky ? "border-coral/60" : undefined}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {tab === "submitted" ? (
                        <input
                          type="checkbox"
                          aria-label={`Select ${s.taskTitle ?? s.taskId}`}
                          className="mt-1.5 h-5 w-5 shrink-0 accent-[#35d27a]"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                        />
                      ) : null}
                      <div className="min-w-0">
                        <CardTitle className="truncate">{s.taskTitle ?? s.taskId}</CardTitle>
                        <p className="mt-0.5 text-sm font-bold text-coin">
                          {formatCurrency(s.reward ?? 0)} · {relativeTime(s.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge tone={tone[s.status]}>{s.status === "submitted" ? "waiting" : s.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <PlayerChip player={s.player} fallback={s.userName} />
                    <ProofLink url={s.proofUrl} />
                    <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                      {typeof s.elapsedSeconds === "number" ? (
                        <span className="rounded-full bg-ink-800 px-2.5 py-1 text-slate-300">
                          Took {s.elapsedSeconds}s
                        </span>
                      ) : null}
                      <span className="rounded-full bg-ink-800 px-2.5 py-1 text-slate-300">
                        Sent {dateTime(s.submittedAt)}
                      </span>
                    </div>
                    {s.notes ? (
                      <p className="break-words rounded-2xl bg-ink-800 p-3 text-sm font-semibold text-slate-300">
                        {s.notes}
                      </p>
                    ) : null}
                    {s.status === "rejected" && s.rejectionReason ? (
                      <p className="text-sm font-bold text-coral">Reason: {s.rejectionReason}</p>
                    ) : null}
                    {s.status === "submitted" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="mint" className="min-h-11" disabled={busy} onClick={() => void approve([s.id])}>
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          className="min-h-11"
                          disabled={busy}
                          onClick={() => {
                            setRejecting(s);
                            setPreset(presets[0]);
                            setCustom("");
                            setFraud(false);
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Reject quest">
          <div className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl border-2 border-ink-600 bg-ink-900 p-5 sm:rounded-3xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-coral">Reject</p>
              <h2 className="font-display text-2xl text-white">{rejecting.taskTitle}</h2>
              <p className="text-sm font-semibold text-slate-400">{rejecting.userName}</p>
            </div>
            <div>
              <Label htmlFor="preset">Reason the player will see</Label>
              <Select id="preset" value={preset} onChange={(e) => setPreset(e.target.value)}>
                {presets.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="custom">Or write your own</Label>
              <Textarea id="custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Optional, replaces the reason above" />
            </div>
            <label className="flex items-start gap-3 rounded-2xl border-2 border-coral/40 bg-coral/10 p-3 text-sm font-bold text-slate-200">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#ff5b57]" checked={fraud} onChange={(e) => setFraud(e.target.checked)} />
              <span>
                This is cheating (fake, edited or stolen proof)
                <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                  Adds a big risk penalty and raises a fraud alert. Repeat cases are suspended automatically.
                </span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="min-h-12" onClick={() => setRejecting(null)}>
                Cancel
              </Button>
              <Button variant="danger" className="min-h-12" disabled={busy} onClick={() => void reject()}>
                {busy ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
