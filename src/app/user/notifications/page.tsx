"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Mail,
  MessageCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { notificationsService } from "@/services/notifications.service";
import { useAuthStore } from "@/store/auth-store";
import { cn, relativeTime } from "@/lib/utils";
import type { AppNotification, NotificationChannel } from "@/types";
import { toast } from "sonner";

const channelStyle: Record<
  NotificationChannel,
  { icon: React.ComponentType<{ className?: string }>; chip: string }
> = {
  in_app: { icon: Sparkles, chip: "bg-coin/10 text-coin" },
  push: { icon: Bell, chip: "bg-flame/10 text-flame" },
  email: { icon: Mail, chip: "bg-sky/10 text-sky" },
  sms: { icon: MessageSquare, chip: "bg-mint/10 text-mint" },
  whatsapp: { icon: MessageCircle, chip: "bg-mint/10 text-mint" },
};

export default function UserNotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await notificationsService.list();
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
    const res = await notificationsService.markAllRead();
    if (res.ok) toast.success(`Marked ${res.data.count} as read`);
    void load();
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <DashboardShell role="user" title="Alerts">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="tabular font-display text-xl text-white">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={unread === 0}
            onClick={() => void markAll()}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all read
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="Payouts, approvals, and race updates will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((n) => {
              const style = channelStyle[n.channel] ?? channelStyle.in_app;
              const Icon = style.icon;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "relative flex gap-3 rounded-xl border p-4 shadow-sm shadow-black/20",
                    n.read
                      ? "border-ink-700/80 bg-ink-900"
                      : "border-coin/40 bg-ink-900",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
                      style.chip,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 font-display text-base leading-tight text-white">
                        {n.title}
                      </p>
                      {!n.read ? (
                        <span
                          role="img"
                          aria-label="Unread"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coin"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-300">
                      {n.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                      <span className="tabular">{relativeTime(n.createdAt)}</span>
                      {n.href ? (
                        <Link
                          href={n.href}
                          className="inline-flex min-h-9 items-center text-sky hover:underline"
                        >
                          Open
                        </Link>
                      ) : null}
                      {!n.read ? (
                        <button
                          type="button"
                          onClick={() => void markOne(n.id)}
                          className="inline-flex min-h-9 items-center text-coin hover:underline"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
