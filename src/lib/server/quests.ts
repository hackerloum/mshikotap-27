import "server-only";
import type { SystemSettings } from "@/config/system";
import { HttpError } from "@/lib/server/http";
import type { Task } from "@/types";

export function minSecondsFor(task: Task, settings: SystemSettings) {
  return task.minSeconds ?? settings.minSecondsToSubmit;
}

export function sessionWindowMs(task: Task) {
  return (task.timeLimitMinutes ?? 24 * 60) * 60_000;
}

export function assertAvailable(task: Task, settings: SystemSettings) {
  if (!settings.questsOpen) {
    throw new HttpError(503, "QUESTS_PAUSED", "Quests are paused for a moment. Check back soon.");
  }
  if (task.status !== "open") throw new HttpError(409, "CLOSED", "This quest is closed");
  if (task.expiresAt && new Date(task.expiresAt).getTime() <= Date.now()) {
    throw new HttpError(409, "CLOSED", "This quest has ended");
  }
  if (task.maxCompletions && task.completions >= task.maxCompletions) {
    throw new HttpError(409, "FULL", "This quest is full");
  }
}
