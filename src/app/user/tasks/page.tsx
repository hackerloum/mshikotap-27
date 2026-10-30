"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { tasksService } from "@/services/tasks.service";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/lib/utils";
import type { Task, TaskCategory } from "@/types";
import { toast } from "sonner";

const categories: Array<TaskCategory | "all"> = [
  "all",
  "social",
  "youtube",
  "survey",
  "video",
  "daily",
  "typing",
];

export default function UserTasksPage() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TaskCategory | "all">("all");
  const [selected, setSelected] = useState<Task | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await tasksService.list({ category, query });
    if (res.ok) setTasks(res.data);
  }, [category, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selected) return;
    setSubmitting(true);
    const res = await tasksService.submit({
      taskId: selected.id,
      userId: user.uid,
      proofUrl: proofUrl || undefined,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Submission sent for review");
    setSelected(null);
    setProofUrl("");
    setNotes("");
  }

  return (
    <DashboardShell role="user" title="Tasks">
      <div className="space-y-6 animate-rise">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="task-search">Search</Label>
              <Input
                id="task-search"
                placeholder="Search tasks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "secondary"}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Try another category or clear your search."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{task.title}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">{task.description}</p>
                  </div>
                  <Badge tone="brand">{formatCurrency(task.reward)}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <Badge>{task.category}</Badge>
                    <Badge tone="info">+{task.xpReward} XP</Badge>
                    {task.requiresScreenshot ? (
                      <Badge tone="warning">Proof required</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-300">{task.instructions}</p>
                  <Button onClick={() => setSelected(task)}>Submit task</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selected ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg border-teal-400/20">
              <CardHeader>
                <CardTitle>Submit · {selected.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="proof">
                      Proof URL {selected.requiresScreenshot ? "(required)" : "(optional)"}
                    </Label>
                    <Input
                      id="proof"
                      placeholder="https://…"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      required={selected.requiresScreenshot}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Anything the reviewer should know…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting…" : "Send submission"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelected(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
