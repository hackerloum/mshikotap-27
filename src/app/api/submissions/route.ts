import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { publicSubmission } from "@/lib/server/views";
import type { TaskSubmission } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const list = rows<TaskSubmission & Record<string, unknown>>(
      await db().collection(col.submissions).where("userId", "==", uid).get(),
    ).map(publicSubmission);
    return list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  });
}
