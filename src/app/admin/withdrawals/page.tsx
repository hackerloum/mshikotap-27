"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { walletService } from "@/services/wallet.service";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, relativeTime } from "@/lib/utils";
import type { Withdrawal } from "@/types";
import { toast } from "sonner";

const statusTone = {
  pending: "warning",
  under_review: "info",
  approved: "brand",
  processing: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "default",
} as const;

export default function AdminWithdrawalsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Withdrawal[]>([]);

  const load = useCallback(async () => {
    const res = await walletService.listWithdrawals();
    if (res.ok) setItems(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string, status: Withdrawal["status"]) {
    if (!user) return;
    const res = await walletService.updateStatus(id, status, user.uid);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Withdrawal ${status}`);
    void load();
  }

  const actionable = items.filter(
    (w) => w.status === "pending" || w.status === "under_review",
  );

  return (
    <DashboardShell role="admin" title="Withdrawals">
      <div className="space-y-6 animate-rise">
        {actionable.length === 0 ? (
          <EmptyState title="No pending withdrawals" />
        ) : (
          <div className="grid gap-4">
            {actionable.map((w) => (
              <Card key={w.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {formatCurrency(w.amount)} → {formatCurrency(w.netAmount)}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {w.method.replaceAll("_", " ")} · {w.destination} · fee{" "}
                      {formatCurrency(w.fee)} · {relativeTime(w.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone[w.status]}>{w.status}</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void update(w.id, "approved")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void update(w.id, "completed")}
                  >
                    Mark completed
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void update(w.id, "rejected")}
                  >
                    Reject
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Full history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((w) => (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2"
              >
                <span className="text-sm text-slate-300">
                  {w.id} · {formatCurrency(w.amount)} · {w.destination}
                </span>
                <Badge tone={statusTone[w.status]}>{w.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
