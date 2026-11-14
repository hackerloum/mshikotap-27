import "server-only";
import type { TaskSubmission } from "@/types";

/** Strips server-only fingerprint fields before a submission is sent to its owner. */
export function publicSubmission<T extends Record<string, unknown>>(sub: T): TaskSubmission {
  const { ipHash, deviceHash, ...rest } = sub;
  void ipHash;
  void deviceHash;
  return rest as unknown as TaskSubmission;
}
