"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, PillTabs } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";
import type { Task, TaskCategory } from "@/types";

const categoryList: TaskCategory[] = ["social", "youtube", "video", "survey", "daily", "typing", "quiz", "app_install", "screenshot"];

const emptyForm = {
  title: "",
  description: "",
  instructions: "",
  category: "social" as TaskCategory,
  reward: "500",
  xpReward: "10",
  targetUrl: "",
  maxCompletions: "",
  minSeconds: "",
  expiresInHours: "",
  requiresScreenshot: true,
};

type Filter = "open" | "closed" | "all";

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
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
      title: form.title,
      description: form.description,
      instructions: form.instructions,
      category: form.category,
      reward: Number(form.reward),
      xpReward: Number(form.xpReward) || undefined,
      targetUrl: form.targetUrl || undefined,
      maxCompletions: form.maxCompletions ? Number(form.maxCompletions) : undefined,
      minSeconds: form.minSeconds !== "" ? Number(form.minSeconds) : undefined,
      expiresInHours: form.expiresInHours ? Number(form.expiresInHours) : undefined,
      requiresScreenshot: form.requiresScreenshot,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Quest is live");
    setForm({ ...emptyForm, category: form.category, reward: form.reward, xpReward: form.xpReward });
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
                <Label htmlFor="q-desc">Short description</Label>
                <Input id="q-desc" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <Label htmlFor="q-ins">How to do it</Label>
                <Textarea id="q-ins" required value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="q-cat">Category</Label>
                <Select id="q-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}>
                  {categoryList.map((c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-1 xl:col-span-3">
                <Label htmlFor="q-link">Quest link (optional)</Label>
                <Input id="q-link" inputMode="url" placeholder="https://..." value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} />
              </div>
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
                <Input id="q-min" type="number" min={0} max={3600} placeholder="Default" value={form.minSeconds} onChange={(e) => setForm({ ...form, minSeconds: e.target.value })} />
                <p className="mt-1 text-xs font-semibold text-slate-500">Players cannot send proof before this. Stops instant claims.</p>
              </div>
              <label className="flex items-center gap-3 self-end rounded-2xl border-2 border-ink-700 bg-ink-950 px-4 py-3 text-sm font-extrabold text-slate-200 md:col-span-2 xl:col-span-3">
                <input type="checkbox" className="h-5 w-5 accent-[#ffc21a]" checked={form.requiresScreenshot} onChange={(e) => setForm({ ...form, requiresScreenshot: e.target.checked })} />
                Players must send a proof link
              </label>
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
            <p className="rounded-2xl border-2 border-dashed border-ink-700 p-6 text-center text-sm font-semibold text-slate-400">
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
                        <p className="text-xs font-semibold text-slate-400">
                          {q.category.replace("_", " ")} · created {relativeTime(q.createdAt)}
                          {q.campaignId ? " · from a campaign" : ""}
                        </p>
                      </div>
                      <Badge tone={isClosed(q) ? "default" : "success"}>{isClosed(q) ? "closed" : "live"}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                      <span className="rounded-full bg-coin/15 px-2.5 py-1 text-coin">{formatCurrency(q.reward)}</span>
                      <span className="rounded-full bg-ink-800 px-2.5 py-1 text-slate-300">
                        {q.completions}
                        {q.maxCompletions ? ` / ${q.maxCompletions}` : ""} approved
                      </span>
                      <span className="rounded-full bg-ink-800 px-2.5 py-1 text-slate-300">
                        Min {q.minSeconds ?? "default"}s
                      </span>
                      {q.expiresAt ? (
                        <span className="rounded-full bg-ink-800 px-2.5 py-1 text-slate-300">
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
                        <Button variant="mint" className="min-h-11" onClick={() => void saveEdit(q)}>
                          Save
                        </Button>
                        <Button variant="secondary" className="min-h-11" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          className="min-h-11"
                          onClick={() => {
                            setEditing(q.id);
                            setEdit({ reward: String(q.reward), maxCompletions: q.maxCompletions ? String(q.maxCompletions) : "" });
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant={q.status === "open" ? "danger" : "mint"} className="min-h-11" onClick={() => void setStatus(q)}>
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
