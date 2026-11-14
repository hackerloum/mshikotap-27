import { FieldValue } from "firebase-admin/firestore";
import { col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PATCH(request: Request, ctx: { params: Promise<{ uid: string }> }) {
  return respond(async () => {
    const { uid: adminId } = await requireSession(request, ["admin"]);
    const { uid } = await ctx.params;
    const body = await readJson<{ isBanned?: boolean; role?: string; grantCredits?: number }>(request);

    const ref = db().collection(col.users).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Player not found");
    if (snap.data()?.role === "admin" && uid !== adminId) {
      throw new HttpError(403, "FORBIDDEN", "Admins are managed through ADMIN_EMAILS");
    }

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (typeof body.isBanned === "boolean") {
      if (uid === adminId) throw new HttpError(400, "INVALID_INPUT", "You cannot ban yourself");
      update.isBanned = body.isBanned;
    }
    if (body.role === "user" || body.role === "advertiser") update.role = body.role;
    if (typeof body.grantCredits === "number" && Number.isFinite(body.grantCredits) && body.grantCredits !== 0) {
      update.advertiserCredits = FieldValue.increment(Math.round(body.grantCredits));
    }
    await ref.update(update);
    return { uid };
  });
}
