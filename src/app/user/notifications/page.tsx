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
  in_app: { icon: Sparkles, chip: "bg-coin/20 text-coin" },
  push: { icon: Bell, chip: "bg-flame/20 text-flame" },
  email: { icon: Mail, chip: "bg-sky/20 text-sky" },
  sms: { icon: MessageSquare, chip: "bg-mint/20 text-mint" },
  whatsapp: { icon: MessageCircle, chip: "bg-mint/20 text-mint" },
};

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

  const unread = items.filter((n) => !n.read).length;

  return (
    <DashboardShell role="user" title="Alerts">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl text-white">
            {unread > 0 ? `${unread} new` : "All caught up"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11"
            disabled={unread === 0}
            onClick={() => void markAll()}
          >
            <CheckCheck className="h-4 w-4" />
            Read all
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="All quiet"
            description="Payouts, approvals, and race updates land here."
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
                    "relative flex gap-3 rounded-3xl border-2 p-4",
                    n.read
                      ? "border-ink-700 bg-ink-900"
                      : "border-coin-deep bg-ink-900 shadow-[0_4px_0_0_var(--color-coin-deep)]",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      style.chip,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 font-display text-lg leading-tight text-white">
                        {n.title}
                      </p>
                      {!n.read ? (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-coin"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-300">
                      {n.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      <span>{relativeTime(n.createdAt)}</span>
                      {n.href ? (
                        <Link
                          href={n.href}
                          className="inline-flex min-h-11 items-center text-sky hover:underline"
                        >
                          Open
                        </Link>
                      ) : null}
                      {!n.read ? (
                        <button
                          type="button"
                          onClick={() => void markOne(n.id)}
                          className="inline-flex min-h-11 items-center text-coin hover:underline"
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
