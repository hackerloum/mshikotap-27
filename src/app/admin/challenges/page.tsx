"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { challengesService } from "@/services/challenges.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Challenge, ChallengeType } from "@/types";
import { toast } from "sonner";

const types: ChallengeType[] = [
  "referral_race",
  "weekly",
  "flash",
  "milestone",
];

const statusTone = {
  live: "success",
  upcoming: "info",
  ended: "default",
} as const;

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("flash");
  const [rewardPool, setRewardPool] = useState("100000");
  const [days, setDays] = useState("3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void challengesService.list().then((res) => {
      if (res.ok) setChallenges(res.data);
    });
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const now = Date.now();
    setSaving(true);
    const res = await challengesService.create({
      title,
      description,
      type,
      rewardPool: Number(rewardPool),
      startsAt: new Date(now).toISOString(),
      endsAt: new Date(now + Number(days) * 864e5).toISOString(),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setChallenges((prev) => [res.data, ...prev]);
    toast.success("Race announced");
    setTitle("");
    setDescription("");
  }

  return (
    <DashboardShell role="admin" title="Challenges">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
              <div className="md:col-span-2">
                <Label htmlFor="ch-title">Title</Label>
                <Input
                  id="ch-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ch-type">Type</Label>
                <Select
                  id="ch-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ChallengeType)}
                >
                  {types.map((t) => (
                    <option key={t} value={t} className="bg-ink-900">
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pool">Reward pool (TSh)</Label>
                <Input
                  id="pool"
                  type="number"
                  min={1}
                  value={rewardPool}
                  onChange={(e) => setRewardPool(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="days">Duration (days)</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="desc">Announcement</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                  {saving ? "Publishing…" : "Publish race"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((ch) => (
            <Card key={ch.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle>{ch.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-400">{ch.description}</p>
                </div>
                <Badge tone={statusTone[ch.status]}>{ch.status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge tone="brand">{ch.type.replaceAll("_", " ")}</Badge>
                <Badge tone="success">Pool {formatCurrency(ch.rewardPool)}</Badge>
                <Badge tone="info">
                  {formatNumber(ch.participants)} participants
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
