import { api } from "@/lib/api-client";
import type { ApiResult, EarningsPoint, Task, TaskCategory, UserRole, SubscriptionPlan } from "@/types";

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  subscription: SubscriptionPlan;
  isBanned: boolean;
  balance: number;
  level: number;
  advertiserCredits: number;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  pendingReviews: number;
  pendingPayouts: number;
  series: EarningsPoint[];
  categories: Array<{ category: string; completions: number }>;
  campaignSpend: number;
}

export const adminService = {
  stats: () => api<AdminStats>("/api/admin/stats"),
  users: () => api<AdminUser[]>("/api/admin/users"),
  updateUser: (uid: string, patch: { isBanned?: boolean; role?: "user" | "advertiser"; grantCredits?: number }) =>
    api<{ uid: string }>(`/api/admin/users/${uid}`, { method: "PATCH", body: patch }),
  tasks: () => api<Task[]>("/api/admin/tasks"),
  createTask: (input: {
    title: string;
    description: string;
    instructions: string;
    category: TaskCategory;
    reward: number;
    xpReward?: number;
    requiresScreenshot?: boolean;
    targetUrl?: string;
    maxCompletions?: number;
  }): Promise<ApiResult<Task>> => api<Task>("/api/admin/tasks", { method: "POST", body: input }),
  setTaskStatus: (id: string, status: "open" | "expired") =>
    api<{ id: string }>(`/api/admin/tasks/${id}`, { method: "PATCH", body: { status } }),
};

export const earningsService = {
  mine: () => api<EarningsPoint[]>("/api/earnings"),
};
