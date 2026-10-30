"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { demoTasks } from "@/data/demo";
import { tasksService } from "@/services/tasks.service";
import { useAuthStore } from "@/store/auth-store";
import { relativeTime } from "@/lib/utils";
import type { TaskSubmission } from "@/types";
import { toast } from "sonner";

const statusTone = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
} as const;

export default function AdminTasksPage() {
  const user = useAuthStore((s) => s.user);
  const [subs, setSubs] = useState<TaskSubmission[]>([]);
  const [reason, setReason] = useState("Insufficient proof");

  const load = useCallback(async () => {
    const res = await tasksService.listSubmissions();
    if (res.ok) setSubs(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(
    id: string,
    decision: "approved" | "rejected",
  ) {
    if (!user) return;
    const res = await tasksService.review(
      id,
      decision,
      user.uid,
      decision === "rejected" ? reason : undefined,
    );
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Submission ${decision}`);
    void load();
  }

  const taskTitle = (taskId: string) =>
    demoTasks.find((t) => t.id === taskId)?.title ?? taskId;

  const pending = subs.filter((s) => s.status === "submitted");

  return (
    <DashboardShell role="admin" title="Task review">
      <div className="space-y-6 animate-rise">
        <Card>
          <CardHeader>
            <CardTitle>Rejection reason (default)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </CardContent>
        </Card>

        {pending.length === 0 ? (
          <EmptyState
            title="No pending submissions"
            description="Approved and rejected items stay in history below."
          />
        ) : (
          <div className="grid gap-4">
            {pending.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{taskTitle(s.taskId)}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {s.id} · user {s.userId} · {relativeTime(s.submittedAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {s.proofUrl ? (
                    <p className="truncate text-sm text-teal-300">{s.proofUrl}</p>
                  ) : (
                    <p className="text-sm text-slate-500">No proof URL</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void review(s.id, "approved")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
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
            <CardTitle>All submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subs.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2"
              >
                <span className="text-sm text-slate-300">
                  {taskTitle(s.taskId)} · {s.id}
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
