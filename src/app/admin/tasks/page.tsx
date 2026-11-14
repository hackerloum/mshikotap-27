"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label, Select, Textarea } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import { tasksService } from "@/services/tasks.service";
import { formatCurrency, relativeTime } from "@/lib/utils";
import type { Task, TaskCategory, TaskSubmission } from "@/types";
import { toast } from "sonner";

const statusTone = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
} as const;

export default function AdminTasksPage() {
  const [subs, setSubs] = useState<TaskSubmission[]>([]);
  const [quests, setQuests] = useState<Task[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    category: "social" as TaskCategory,
    reward: "500",
    xpReward: "10",
    targetUrl: "",
    maxCompletions: "",
    requiresScreenshot: true,
  });
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("Insufficient proof");

  const load = useCallback(async () => {
    const [res, list] = await Promise.all([tasksService.listAllSubmissions(), adminService.tasks()]);
    if (res.ok) setSubs(res.data);
    if (list.ok) setQuests(list.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(
    id: string,
    decision: "approved" | "rejected",
  ) {
    const res = await tasksService.review(id, decision, decision === "rejected" ? reason : undefined);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Submission ${decision}`);
    void load();
  }

  const taskTitle = (s: TaskSubmission) => s.taskTitle ?? s.taskId;

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
      requiresScreenshot: form.requiresScreenshot,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Quest is live");
    setForm({ ...form, title: "", description: "", instructions: "", targetUrl: "" });
    void load();
  }

  async function toggleQuest(q: Task) {
    const res = await adminService.setTaskStatus(q.id, q.status === "open" ? "expired" : "open");
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    void load();
  }

  const pending = subs.filter((s) => s.status === "submitted");

  return (
    <DashboardShell role="admin" title="Quests">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New quest</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createQuest}>
              <div className="md:col-span-2">
                <Label htmlFor="q-title">Title</Label>
                <Input id="q-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="q-desc">Short description</Label>
                <Input id="q-desc" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="q-ins">How to do it</Label>
                <Textarea id="q-ins" required value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="q-cat">Category</Label>
                <Select id="q-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}>
                  {["social", "youtube", "video", "survey", "daily", "typing", "quiz", "app_install", "screenshot"].map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="q-link">Link (optional)</Label>
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
                <Label htmlFor="q-max">Max players (optional)</Label>
                <Input id="q-max" type="number" min={1} value={form.maxCompletions} onChange={(e) => setForm({ ...form, maxCompletions: e.target.value })} />
              </div>
              <label className="flex items-center gap-3 self-end rounded-2xl border-2 border-ink-700 bg-ink-950 px-4 py-3 text-sm font-extrabold text-slate-200">
                <input type="checkbox" className="h-5 w-5 accent-[#ffc21a]" checked={form.requiresScreenshot} onChange={(e) => setForm({ ...form, requiresScreenshot: e.target.checked })} />
                Needs proof link
              </label>
              <Button type="submit" size="lg" className="md:col-span-2" disabled={saving}>
                {saving ? "Publishing…" : "Publish quest"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live quests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quests.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">No quests yet. Publish the first one above.</p>
            ) : (
              quests.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">{q.title}</p>
                    <p className="text-xs font-semibold text-slate-400">{formatCurrency(q.reward)} · {q.completions}{q.maxCompletions ? ` / ${q.maxCompletions}` : ""} done</p>
                  </div>
                  <Button size="sm" variant={q.status === "open" ? "secondary" : "mint"} onClick={() => void toggleQuest(q)}>
                    {q.status === "open" ? "Close" : "Reopen"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </CardContent>
        </Card>

        {pending.length === 0 ? (
          <EmptyState
            title="No pending submissions"
            description="Reviewed items stay in the history below."
          />
        ) : (
          <div className="grid gap-4">
            {pending.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{taskTitle(s)}</CardTitle>
                    <p className="mt-1 break-words text-sm text-slate-400">
                      {s.userName ?? s.userId} · {formatCurrency(s.reward ?? 0)} · {relativeTime(s.submittedAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {s.proofUrl ? (
                    <p className="truncate text-sm font-bold text-sky">{s.proofUrl}</p>
                  ) : (
                    <p className="text-sm text-slate-500">No proof URL</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <Button
                      size="sm"
                      variant="mint"
                      className="min-h-11"
                      onClick={() => void review(s.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="min-h-11"
                      onClick={() => void review(s.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subs.length === 0 ? <p className="text-sm font-semibold text-slate-400">Nothing submitted yet.</p> : null}
            {subs.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-bold text-slate-200">
                  {taskTitle(s)} · {s.userName ?? s.userId}
                </span>
                <Badge tone={statusTone[s.status]}>{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
