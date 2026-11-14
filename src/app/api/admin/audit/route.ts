import { col, db, requireSession, respond, rows } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const snap = await db().collection(col.audit).orderBy("createdAt", "desc").limit(200).get();
    return rows<Record<string, unknown>>(snap);
  });
}
