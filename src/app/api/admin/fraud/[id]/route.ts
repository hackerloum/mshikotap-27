import { auditInTx } from "@/lib/server/audit";
import { col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";
import { applyRisk, readSecurity, type FraudFlag } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";

export const runtime = "nodejs";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ action?: string }>(request);
    if (body.action !== "dismiss" && body.action !== "confirm") {
      throw new HttpError(400, "INVALID_INPUT", "action must be dismiss or confirm");
    }
    const dismiss = body.action === "dismiss";
    const settings = await getSettings();
    const firestore = db();
    const ref = firestore.collection(col.flags).doc(id);

    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Alert not found");
      const flag = { ...(snap.data() as FraudFlag), id };
      if (flag.status !== "open") throw new HttpError(409, "ALREADY_RESOLVED", "This alert was already handled");

      const sec = await readSecurity(tx, firestore, flag.userId);
      tx.update(ref, {
        status: dismiss ? "dismissed" : "confirmed",
        resolvedAt: new Date().toISOString(),
        resolvedBy: uid,
      });
      if (dismiss && flag.points > 0) {
        applyRisk(tx, firestore, flag.userId, sec, -flag.points, settings);
      }
      auditInTx(tx, firestore, {
        actorId: uid,
        actorName: profile.displayName,
        action: dismiss ? "fraud.dismiss" : "fraud.confirm",
        entityType: "fraud",
        entityId: id,
        summary: `${dismiss ? "Dismissed" : "Confirmed"} alert "${flag.kind}" for player ${flag.userId}`,
      });
      return { id, status: dismiss ? "dismissed" : "confirmed" };
    });
  });
}
