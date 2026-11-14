import { auditNow } from "@/lib/server/audit";
import { amount, col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";
import type { Task } from "@/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ status?: string; reward?: number; maxCompletions?: number | null }>(request);

    const ref = db().collection(col.tasks).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Quest not found");
    const task = snap.data() as Task;

    const update: Record<string, unknown> = {};
    const notes: string[] = [];
    if (body.status !== undefined) {
      if (body.status !== "open" && body.status !== "expired") {
        throw new HttpError(400, "INVALID_INPUT", "Status must be open or expired");
      }
      update.status = body.status;
      notes.push(body.status === "open" ? "reopened" : "closed");
    }
    if (body.reward !== undefined) {
      update.reward = amount(body.reward, "Reward");
      notes.push(`reward ${task.reward} -> ${update.reward}`);
    }
    if (body.maxCompletions !== undefined) {
      update.maxCompletions = body.maxCompletions === null ? null : amount(body.maxCompletions, "Max players");
      notes.push(`max players ${task.maxCompletions ?? "none"} -> ${update.maxCompletions ?? "none"}`);
    }
    if (Object.keys(update).length === 0) throw new HttpError(400, "INVALID_INPUT", "Nothing to change");

    await ref.update(update);
    await auditNow(db(), {
      actorId: uid,
      actorName: profile.displayName,
      action: "task.update",
      entityType: "task",
      entityId: id,
      summary: `Quest "${task.title}": ${notes.join(", ")}`,
    });
    return { id, ...update };
  });
}
