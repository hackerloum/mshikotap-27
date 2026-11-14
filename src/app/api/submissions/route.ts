import { col, db, HttpError, requireSession, respond, rows } from "@/lib/server/http";
import type { TaskSubmission } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    const scope = new URL(request.url).searchParams.get("scope");
    const { uid, profile } = await requireSession(request);

    let list: TaskSubmission[];
    if (scope === "all") {
      if (profile.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Admins only");
      list = rows<TaskSubmission>(await db().collection(col.submissions).limit(300).get());
    } else {
      list = rows<TaskSubmission>(
        await db().collection(col.submissions).where("userId", "==", uid).get(),
      );
    }
    return list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  });
}
