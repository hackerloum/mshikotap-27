import { api } from "@/lib/api-client";
import type { ApiResult, Task, TaskCategory, TaskSubmission } from "@/types";

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

  listAllSubmissions(): Promise<ApiResult<TaskSubmission[]>> {
    return api<TaskSubmission[]>("/api/submissions?scope=all");
  },

  submit(input: { taskId: string; proofUrl?: string; notes?: string }): Promise<ApiResult<TaskSubmission>> {
    return api<TaskSubmission>("/api/tasks", { method: "POST", body: input });
  },

  review(submissionId: string, decision: "approved" | "rejected", reason?: string) {
    return api<{ id: string; status: string }>(`/api/submissions/${submissionId}`, {
      method: "PATCH",
      body: { decision, reason },
    });
  },
};
