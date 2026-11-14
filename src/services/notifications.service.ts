import { api } from "@/lib/api-client";
import type { ApiResult, AppNotification } from "@/types";

export const notificationsService = {
  list(): Promise<ApiResult<AppNotification[]>> {
    return api<AppNotification[]>("/api/notifications");
  },

  markRead(id: string): Promise<ApiResult<{ count: number }>> {
    return api<{ count: number }>("/api/notifications", { method: "PATCH", body: { id } });
  },

  markAllRead(): Promise<ApiResult<{ count: number }>> {
    return api<{ count: number }>("/api/notifications", { method: "PATCH", body: { all: true } });
  },
};
