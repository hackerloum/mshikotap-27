import { api } from "@/lib/api-client";
import type { ApiResult, Task, TaskCategory, TaskSubmission } from "@/types";

export interface QuestSession {
  taskId: string;
  startedAt: string;
  readyAt: string;
  expiresAt?: string;
  minSeconds: number;
  serverNow: string;
}

export const tasksService = {
  list(filters?: { category?: TaskCategory | "all"; query?: string }): Promise<ApiResult<Task[]>> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== "all") params.set("category", filters.category);
    if (filters?.query) params.set("q", filters.query);
    return api<Task[]>(`/api/tasks?${params}`);
  },

  listSubmissions(): Promise<ApiResult<TaskSubmission[]>> {
    return api<TaskSubmission[]>("/api/submissions");
  },

  start(taskId: string): Promise<ApiResult<QuestSession>> {
    return api<QuestSession>("/api/tasks/start", { method: "POST", body: { taskId } });
  },

  submit(input: { taskId: string; proofUrl?: string; notes?: string }): Promise<ApiResult<TaskSubmission>> {
    return api<TaskSubmission>("/api/tasks", { method: "POST", body: input });
  },
};
