import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { playerContext } from "@/lib/server/admin-views";
import { getSettings } from "@/lib/server/settings";
import type { FraudFlag } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const status = new URL(request.url).searchParams.get("status") ?? "open";
    const settings = await getSettings();
    const firestore = db();
    const query =
      status === "all"
        ? firestore.collection(col.flags)
        : firestore.collection(col.flags).where("status", "==", status);
    const list = rows<FraudFlag>(await query.limit(300).get());
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ctx = await playerContext(firestore, list.map((f) => f.userId), settings.holdRiskScore);
    return list.map((f) => ({ ...f, player: ctx.get(f.userId) ?? null }));
  });
}
