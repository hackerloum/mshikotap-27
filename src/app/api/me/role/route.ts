import { col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request);
    const body = await readJson<{ role?: string }>(request);
    if (body.role !== "user" && body.role !== "advertiser") {
      throw new HttpError(400, "INVALID_INPUT", "Choose player or advertiser");
    }
    if (profile.role === "admin") {
      throw new HttpError(403, "FORBIDDEN", "The owner account always stays admin");
    }
    if (profile.role !== body.role) {
      await db().collection(col.users).doc(uid).update({ role: body.role, updatedAt: new Date().toISOString() });
    }
    return { role: body.role };
  });
}
