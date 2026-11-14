"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";
import { QuestFormFields, draftToPayload, emptyDraft } from "@/components/quests/quest-form-fields";
import { categoryLabel, creatableCategories } from "@/config/quests";
import type { Task } from "@/types";

const emptyForm = {
  title: "",
  description: "",
  reward: "500",
  xpReward: "10",
  maxCompletions: "",
  minSeconds: "",
  expiresInHours: "",
};

type Filter = "open" | "closed" | "all";

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [draft, setDraft] = useState(() => emptyDraft("social"));
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ reward: "", maxCompletions: "" });

  const load = useCallback(async () => {
    const res = await adminService.tasks();
    if (res.ok) setQuests(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createQuest(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await adminService.createTask({
      ...draftToPayload(draft),
      title: form.title,
      description: form.description || undefined,
      reward: Number(form.reward),
      xpReward: Number(form.xpReward) || undefined,
      maxCompletions: form.maxCompletions ? Number(form.maxCompletions) : undefined,
      minSeconds: form.minSeconds !== "" ? Number(form.minSeconds) : undefined,
      expiresInHours: form.expiresInHours ? Number(form.expiresInHours) : undefined,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Quest is live");
    setForm({ ...emptyForm, reward: form.reward, xpReward: form.xpReward });
    setDraft(emptyDraft(draft.category));
    void load();
  }

  async function setStatus(q: Task) {
    const res = await adminService.updateTask(q.id, { status: q.status === "open" ? "expired" : "open" });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(q.status === "open" ? "Quest closed" : "Quest reopened");
    void load();
  }

  async function saveEdit(q: Task) {
    const res = await adminService.updateTask(q.id, {
      reward: Number(edit.reward),
      maxCompletions: edit.maxCompletions ? Number(edit.maxCompletions) : null,
    });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Quest updated");
    setEditing(null);
    void load();
  }

  const isClosed = (q: Task) =>
    q.status !== "open" ||
    (q.expiresAt ? new Date(q.expiresAt).getTime() <= Date.now() : false) ||
    Boolean(q.maxCompletions && q.completions >= q.maxCompletions);

  const shown = quests.filter((q) => (filter === "all" ? true : filter === "open" ? !isClosed(q) : isClosed(q)));

  return (
    <DashboardShell role="admin" title="Quests">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New quest</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={createQuest}>
              <div className="md:col-span-2 xl:col-span-4">
                <Label htmlFor="q-title">Title</Label>
                <Input id="q-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <Label htmlFor="q-desc">Short description (optional)</Label>
                <Input id="q-desc" maxLength={160} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <QuestFormFields draft={draft} onChange={setDraft} categories={creatableCategories} idPrefix="admin-q" />
              <div>
                <Label htmlFor="q-reward">Reward (TSh)</Label>
                <Input id="q-reward" type="number" min={1} required value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="q-xp">XP</Label>
                <Input id="q-xp" type="number" min={1} value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="q-max">Max players</Label>
                <Input id="q-max" type="number" min={1} placeholder="No limit" value={form.maxCompletions} onChange={(e) => setForm({ ...form, maxCompletions: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="q-exp">Ends in (hours)</Label>
                <Input id="q-exp" type="number" min={1} placeholder="Never" value={form.expiresInHours} onChange={(e) => setForm({ ...form, expiresInHours: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="q-min">Min seconds to finish</Label>
                <Input id="q-min" type="number" min={0} max={3600} placeholder="Automatic" value={form.minSeconds} onChange={(e) => setForm({ ...form, minSeconds: e.target.value })} />
                <p className="mt-1 text-xs text-slate-500">Players cannot send proof before this. Stops instant claims.</p>
              </div>
              <Button type="submit" size="lg" className="md:col-span-2 xl:col-span-4" disabled={saving}>
                {saving ? "Publishing…" : "Publish quest"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <PillTabs
            value={filter}
            onChange={setFilter}
            options={[
              { id: "open", label: "Live", count: quests.filter((q) => !isClosed(q)).length },
              { id: "closed", label: "Closed", count: quests.filter(isClosed).length },
              { id: "all", label: "All", count: quests.length },
            ]}
          />

          {loading ? (
            <Loading />
          ) : shown.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-700/80 p-6 text-center text-sm text-slate-400">
              No quests here. Publish the first one above.
            </p>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {shown.map((q) => (
                <Card key={q.id}>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl text-white">{q.title}</p>
                        <p className="text-xs text-slate-400">
                          {categoryLabel(q.category)} · created {relativeTime(q.createdAt)}
                          {q.campaignId ? " · from a campaign" : ""}
                        </p>
                      </div>
                      <Badge tone={isClosed(q) ? "default" : "success"}>{isClosed(q) ? "closed" : "live"}</Badge>
                    </div>
                    <div className="tabular flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-md bg-coin/10 px-2 py-1 text-coin">{formatCurrency(q.reward)}</span>
                      <span className="rounded-md bg-ink-800 px-2 py-1 text-slate-300">
                        {q.completions}
                        {q.maxCompletions ? ` / ${q.maxCompletions}` : ""} approved
                      </span>
                      <span className="rounded-md bg-ink-800 px-2 py-1 text-slate-300">
                        Min {q.minSeconds ?? "default"}s
                      </span>
                      {q.expiresAt ? (
                        <span className="rounded-md bg-ink-800 px-2 py-1 text-slate-300">
                          Ends {new Date(q.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </span>
                      ) : null}
                    </div>

                    {editing === q.id ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`r-${q.id}`}>Reward</Label>
                          <Input id={`r-${q.id}`} type="number" min={1} value={edit.reward} onChange={(e) => setEdit({ ...edit, reward: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor={`m-${q.id}`}>Max players</Label>
                          <Input id={`m-${q.id}`} type="number" min={1} placeholder="No limit" value={edit.maxCompletions} onChange={(e) => setEdit({ ...edit, maxCompletions: e.target.value })} />
                        </div>
                        <Button variant="mint" size="sm" onClick={() => void saveEdit(q)}>
                          Save
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(q.id);
                            setEdit({ reward: String(q.reward), maxCompletions: q.maxCompletions ? String(q.maxCompletions) : "" });
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant={q.status === "open" ? "danger" : "mint"} size="sm" onClick={() => void setStatus(q)}>
                          {q.status === "open" ? "Close" : "Reopen"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
