"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { campaignsService } from "@/services/campaigns.service";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/lib/utils";
import type { Campaign, CampaignType } from "@/types";
import { toast } from "sonner";

const campaignTypes: CampaignType[] = [
  "instagram_follow",
  "tiktok_follow",
  "youtube_subscribe",
  "website_visit",
  "app_install",
  "survey",
  "comment_engagement",
];

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
  const [type, setType] = useState<CampaignType>("instagram_follow");
  const [budget, setBudget] = useState("50000");
  const [cpa, setCpa] = useState("500");
  const [instructions, setInstructions] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await campaignsService.list();
    if (res.ok) setCampaigns(res.data);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const res = await campaignsService.create({
      title,
      type,
      budgetCredits: Number(budget),
      costPerAction: Number(cpa),
      instructions,
      targetUrl: targetUrl || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Campaign created");
    setTitle("");
    setInstructions("");
    setTargetUrl("");
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
    toast.success(`Campaign ${next}`);
    void load();
  }

  return (
    <DashboardShell role="advertiser" title="Campaigns">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
              <div className="md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as CampaignType)}
                >
                  {campaignTypes.map((t) => (
                    <option key={t} value={t} className="bg-ink-900">
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="url">Target URL</Label>
                <Input
                  id="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget (credits)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={1}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cpa">Cost per action</Label>
                <Input
                  id="cpa"
                  type="number"
                  min={1}
                  value={cpa}
                  onChange={(e) => setCpa(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? "Creating…" : "Launch it"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {campaigns.length === 0 ? (
          <EmptyState title="No campaigns yet" description="Make your first one above." />
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{c.title}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {c.type.replaceAll("_", " ")} · CPA {c.costPerAction} ·{" "}
                      {formatNumber(c.completions)} completions
                    </p>
                  </div>
                  <Badge tone={statusTone[c.status]}>{c.status}</Badge>
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
                      Spent {formatNumber(c.spentCredits)} /{" "}
                      {formatNumber(c.budgetCredits)} credits
                    </p>
                    {(c.status === "active" || c.status === "paused") && (
                      <Button
                        className="min-h-11 w-full sm:w-auto"
                        size="sm"
                        variant={c.status === "active" ? "secondary" : "mint"}
                        onClick={() => void toggleStatus(c)}
                      >
                        {c.status === "active" ? "Pause" : "Resume"}
                      </Button>
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
