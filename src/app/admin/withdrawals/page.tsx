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
      <div className="space-y-6">
        {actionable.length === 0 ? (
          <EmptyState title="No pending withdrawals" description="New payout requests show up here." />
        ) : (
          <div className="grid gap-4">
            {actionable.map((w) => (
              <Card key={w.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>
                      {formatCurrency(w.amount)} → {formatCurrency(w.netAmount)}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {w.method.replaceAll("_", " ")} · {w.destination} · fee{" "}
                      {formatCurrency(w.fee)} · {relativeTime(w.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone[w.status]}>{w.status.replaceAll("_", " ")}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button
                    size="sm"
                    variant="mint"
                    className="min-h-11"
                    onClick={() => void update(w.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => void update(w.id, "completed")}
                  >
                    Mark paid
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="col-span-2 min-h-11 sm:col-span-1"
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
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-bold text-slate-200">
                  {w.id} · {formatCurrency(w.amount)} · {w.destination}
                </span>
                <Badge tone={statusTone[w.status]}>{w.status.replaceAll("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
