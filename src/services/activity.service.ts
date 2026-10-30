import type { ActivityLog } from "@/types";

const logs: ActivityLog[] = [];

export const activityService = {
  async log(entry: Omit<ActivityLog, "id" | "createdAt">) {
    const record: ActivityLog = {
      ...entry,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(record);
    if (logs.length > 500) logs.pop();
    return record;
  },

  async list(limit = 50) {
    return logs.slice(0, limit);
  },
};
