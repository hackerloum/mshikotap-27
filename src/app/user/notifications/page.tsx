"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { notificationsService } from "@/services/notifications.service";
import { useAuthStore } from "@/store/auth-store";
import { relativeTime } from "@/lib/utils";
import type { AppNotification } from "@/types";
import { toast } from "sonner";

export default function UserNotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await notificationsService.list(user.uid);
    if (res.ok) setItems(res.data);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markOne(id: string) {
    await notificationsService.markRead(id);
    void load();
  }

  async function markAll() {
    if (!user) return;
    const res = await notificationsService.markAllRead(user.uid);
    if (res.ok) toast.success(`Marked ${res.data.count} as read`);
    void load();
  }

  return (
    <DashboardShell role="user" title="Notifications">
      <div className="space-y-6 animate-rise">
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => void markAll()}>
            Mark all read
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="All quiet"
            description="You’ll see payouts, approvals, and challenge updates here."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      {!n.read ? <Badge tone="brand">New</Badge> : null}
                      <Badge>{n.channel}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {relativeTime(n.createdAt)}
                      {n.href ? (
                        <>
                          {" · "}
                          <Link href={n.href} className="text-teal-300 hover:underline">
                            Open
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {!n.read ? (
                    <Button size="sm" variant="outline" onClick={() => void markOne(n.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
