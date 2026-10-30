import { demoNotifications } from "@/data/demo";
import { fromUnknown, ok } from "@/lib/errors/app-error";
import type { ApiResult, AppNotification } from "@/types";

let notifications = structuredClone(demoNotifications);

export const notificationsService = {
  async list(userId: string): Promise<ApiResult<AppNotification[]>> {
    try {
      return ok(notifications.filter((n) => n.userId === userId));
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async markRead(id: string): Promise<ApiResult<AppNotification>> {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    const updated = notifications.find((n) => n.id === id)!;
    return ok(updated);
  },

  async markAllRead(userId: string): Promise<ApiResult<{ count: number }>> {
    let count = 0;
    notifications = notifications.map((n) => {
      if (n.userId === userId && !n.read) {
        count += 1;
        return { ...n, read: true };
      }
      return n;
    });
    return ok({ count });
  },
};
