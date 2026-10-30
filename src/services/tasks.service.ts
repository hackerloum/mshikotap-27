import { demoSubmissions, demoTasks } from "@/data/demo";
import { ok, fromUnknown, AppError } from "@/lib/errors/app-error";
import { activityService } from "@/services/activity.service";
import type { ApiResult, Task, TaskCategory, TaskSubmission } from "@/types";

const tasks = structuredClone(demoTasks);
let submissions = structuredClone(demoSubmissions);

export const tasksService = {
  async list(filters?: {
    category?: TaskCategory | "all";
    query?: string;
  }): Promise<ApiResult<Task[]>> {
    try {
      let result = [...tasks];
      if (filters?.category && filters.category !== "all") {
        result = result.filter((t) => t.category === filters.category);
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        result = result.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q),
        );
      }
      return ok(result);
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async getById(id: string): Promise<ApiResult<Task>> {
    const task = tasks.find((t) => t.id === id);
    if (!task) return fromUnknown(new AppError("NOT_FOUND", "Task not found", 404));
    return ok(task);
  },

  async listSubmissions(userId?: string): Promise<ApiResult<TaskSubmission[]>> {
    const result = userId
      ? submissions.filter((s) => s.userId === userId)
      : submissions;
    return ok(result);
  },

  async submit(input: {
    taskId: string;
    userId: string;
    proofUrl?: string;
    notes?: string;
  }): Promise<ApiResult<TaskSubmission>> {
    try {
      const task = tasks.find((t) => t.id === input.taskId);
      if (!task) throw new AppError("NOT_FOUND", "Task not found", 404);
      if (task.requiresScreenshot && !input.proofUrl) {
        throw new AppError("PROOF_REQUIRED", "Screenshot proof is required");
      }
      const submission: TaskSubmission = {
        id: `sub-${Date.now()}`,
        taskId: input.taskId,
        userId: input.userId,
        status: "submitted",
        proofUrl: input.proofUrl,
        notes: input.notes,
        submittedAt: new Date().toISOString(),
      };
      submissions = [submission, ...submissions];
      await activityService.log({
        actorId: input.userId,
        action: "task.submit",
        entityType: "task_submission",
        entityId: submission.id,
        metadata: { taskId: input.taskId },
      });
      return ok(submission);
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async review(
    submissionId: string,
    decision: "approved" | "rejected",
    reviewerId: string,
    rejectionReason?: string,
  ): Promise<ApiResult<TaskSubmission>> {
    try {
      const index = submissions.findIndex((s) => s.id === submissionId);
      if (index < 0) throw new AppError("NOT_FOUND", "Submission not found", 404);
      const updated: TaskSubmission = {
        ...submissions[index],
        status: decision,
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString(),
        rejectionReason: decision === "rejected" ? rejectionReason : undefined,
      };
      submissions[index] = updated;
      await activityService.log({
        actorId: reviewerId,
        action: `task.${decision}`,
        entityType: "task_submission",
        entityId: submissionId,
      });
      return ok(updated);
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
