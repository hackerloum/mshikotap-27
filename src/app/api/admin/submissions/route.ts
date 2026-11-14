import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { playerContext } from "@/lib/server/admin-views";
import { getSettings } from "@/lib/server/settings";
import type { TaskSubmission } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const status = new URL(request.url).searchParams.get("status") ?? "submitted";
    const settings = await getSettings();
    const firestore = db();

    const query =
      status === "all"
        ? firestore.collection(col.submissions)
        : firestore.collection(col.submissions).where("status", "==", status);
    const list = rows<TaskSubmission>(await query.limit(300).get());
    list.sort((a, b) =>
      status === "submitted" ? a.submittedAt.localeCompare(b.submittedAt) : b.submittedAt.localeCompare(a.submittedAt),
    );

    const ctx = await playerContext(firestore, list.map((s) => s.userId), settings.holdRiskScore);
    return list.map((s) => {
      const { ...rest } = s as TaskSubmission & Record<string, unknown>;
      delete rest.ipHash;
      delete rest.deviceHash;
      return { ...rest, player: ctx.get(s.userId) ?? null };
    });
  });
}
