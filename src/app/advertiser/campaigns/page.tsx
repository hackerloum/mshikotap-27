"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { Input, Label } from "@/components/ui/input";
import { QuestFormFields, draftToPayload, emptyDraft } from "@/components/quests/quest-form-fields";
import { advertiserCategories, categoryLabel } from "@/config/quests";
import Link from "next/link";
import { campaignsService, type CampaignResults } from "@/services/campaigns.service";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Campaign } from "@/types";
import { toast } from "sonner";

const statusLabel = {
  draft: "In review",
  active: "Live",
  paused: "Paused",
  completed: "Stopped",
  rejected: "Not approved",
} as const;

const statusTone = {
  draft: "default",
  active: "success",
  paused: "warning",
  completed: "info",
  rejected: "danger",
} as const;

export default function AdvertiserCampaignsPage() {
  const user = useAuthStore((s) => s.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState(() => emptyDraft("social"));
  const [openResults, setOpenResults] = useState<string | null>(null);
  const [results, setResults] = useState<CampaignResults | null>(null);
  const refresh = useAuthStore((s) => s.refreshProfile);
  const cfg = useConfigStore((s) => s.config);
  const [slotsInput, setSlotsInput] = useState("100");
  const [cpa, setCpa] = useState("1000");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await campaignsService.list();
    if (res.ok) setCampaigns(res.data);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const slots = Math.max(0, Math.floor(Number(slotsInput) || 0));
  const cost = Math.max(0, Math.floor(Number(cpa) || 0));
  const total = slots * cost;
  const playerGets = Math.floor((cost * cfg.playerSharePercent) / 100);
  const balance = user?.advertiserCredits ?? 0;
  const short = total > balance;

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (short) {
      toast.error("Add money first. Your balance does not cover this quest.");
      return;
    }
    setSaving(true);
    const res = await campaignsService.create({
      ...draftToPayload(draft),
      title,
      budgetCredits: total,
      costPerAction: Number(cpa),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(res.data.status === "draft" ? "Sent for approval. You will be told when it is live." : "Your quest is live");
    void refresh();
    setTitle("");
    setDraft(emptyDraft(draft.category));
    void load();
  }

  async function toggleStatus(c: Campaign) {
    if (!user) return;
    const next = c.status === "active" ? "paused" : "active";
    const res = await campaignsService.setStatus(c.id, next);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Quest ${next}`);
    void load();
  }

  async function toggleResults(c: Campaign) {
    if (openResults === c.id) {
      setOpenResults(null);
      return;
    }
    const res = await campaignsService.results(c.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setResults(res.data);
    setOpenResults(c.id);
  }

  async function stop(c: Campaign) {
    if (!window.confirm("Stop this quest? Money not yet used is returned to your balance.")) return;
    const res = await campaignsService.setStatus(c.id, "completed");
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Quest stopped and unused money returned");
    void refresh();
    void load();
  }

  return (
    <DashboardShell role="advertiser" title="Campaigns">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post a quest</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={onCreate}>
              <div className="md:col-span-2 xl:col-span-4">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
              </div>
              <QuestFormFields draft={draft} onChange={setDraft} categories={advertiserCategories} idPrefix="adv" />
              <div className="xl:col-span-2">
                <Label htmlFor="slots">How many people</Label>
                <Input id="slots" type="number" min={1} value={slotsInput} onChange={(e) => setSlotsInput(e.target.value)} required />
              </div>
              <div className="xl:col-span-2">
                <Label htmlFor="cpa">You pay per person (TSh)</Label>
                <Input id="cpa" type="number" min={cfg.minCostPerAction} value={cpa} onChange={(e) => setCpa(e.target.value)} required />
                <p className="mt-1 text-xs text-slate-500">
                  Minimum {formatCurrency(cfg.minCostPerAction)}. The player gets {formatCurrency(playerGets)}.
                </p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 md:col-span-2 xl:col-span-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total to pay now</p>
                <p className="font-display text-3xl text-white">{formatCurrency(total)}</p>
                <p className="text-xs text-slate-400">
                  Your balance: {formatCurrency(balance)}. Whatever is not used is returned if you stop the quest.
                </p>
                {short ? (
                  <Link href="/advertiser/credits" className="mt-2 inline-block text-sm font-semibold text-coin hover:underline">
                    Add {formatCurrency(total - balance)} to continue
                  </Link>
                ) : null}
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <Button type="submit" disabled={saving || short} className="w-full sm:w-auto">
                  {saving ? "Sending…" : "Post quest"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {campaigns.length === 0 ? (
          <EmptyState title="No quests yet" description="Add money, then post your first quest above." />
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{c.title}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {categoryLabel(c.type)} · {formatCurrency(c.costPerAction)} each ·{" "}
                      {formatNumber(c.completions)} done
                    </p>
                  </div>
                  <Badge tone={statusTone[c.status]}>{statusLabel[c.status]}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProgressBar
                    value={c.spentCredits}
                    max={Math.max(1, c.budgetCredits)}
                    tone="coin"
                    label={`${c.title} budget used`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">
                      Used {formatCurrency(c.spentCredits)} of {formatCurrency(c.budgetCredits)}
                      {c.status === "rejected" && c.statusReason ? ` · ${c.statusReason}` : ""}
                    </p>
                    <div className="flex w-full gap-2 sm:w-auto">
                      {c.type === "survey" && (
                        <Button className="min-h-11 flex-1" size="sm" variant="sky" onClick={() => void toggleResults(c)}>
                          {openResults === c.id ? "Hide answers" : "See answers"}
                        </Button>
                      )}
                      {(c.status === "active" || c.status === "paused") && (
                        <Button
                          className="min-h-11 flex-1"
                          size="sm"
                          variant={c.status === "active" ? "secondary" : "mint"}
                          onClick={() => void toggleStatus(c)}
                        >
                          {c.status === "active" ? "Pause" : "Resume"}
                        </Button>
                      )}
                      {(c.status === "active" || c.status === "paused" || c.status === "draft") && (
                        <Button className="min-h-11 flex-1" size="sm" variant="danger" onClick={() => void stop(c)}>
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>
                  {openResults === c.id && results ? <SurveyResults data={results} /> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function SurveyResults({ data }: { data: CampaignResults }) {
  if (data.responses === 0) {
    return <p className="rounded-lg bg-ink-800 p-3 text-sm text-slate-400">No answers yet.</p>;
  }
  return (
    <div className="space-y-4 rounded-lg bg-ink-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{data.responses} answers</p>
      {data.questions.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <p className="text-sm font-semibold text-white">{q.text}</p>
          {q.counts
            ? Object.entries(q.counts).map(([label, n]) => (
                <div key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="w-28 shrink-0 truncate">{label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-950">
                    <span className="block h-full bg-coin" style={{ width: `${Math.round((n / data.responses) * 100)}%` }} />
                  </span>
                  <span className="w-8 text-right">{n}</span>
                </div>
              ))
            : null}
          {q.average !== undefined ? <p className="text-xs text-slate-400">Average {q.average} of 5</p> : null}
          {q.texts ? (
            <ul className="space-y-1 text-xs font-semibold text-slate-300">
              {q.texts.map((t, i) => (
                <li key={i} className="rounded-lg bg-ink-950 px-2.5 py-1.5">{t}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
