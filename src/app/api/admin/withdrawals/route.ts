import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { playerContext } from "@/lib/server/admin-views";
import { getSettings } from "@/lib/server/settings";
import type { Withdrawal } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const settings = await getSettings();
    const firestore = db();
    const list = rows<Withdrawal>(await firestore.collection(col.withdrawals).limit(300).get());
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ctx = await playerContext(firestore, list.map((w) => w.userId), settings.holdRiskScore);
    return list.map((w) => ({ ...w, player: ctx.get(w.userId) ?? null }));
  });
}
