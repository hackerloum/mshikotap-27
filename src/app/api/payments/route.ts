import { col, db, requireSession, respond } from "@/lib/server/http";
import type { PaymentDoc } from "@/lib/server/money";
import type { PaymentRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const snap = await db().collection(col.payments).where("uid", "==", uid).get();
    return snap.docs
      .map((d) => {
        const p = d.data() as PaymentDoc;
        const record: PaymentRecord = {
          id: d.id,
          uid: p.uid,
          kind: p.kind,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
          ...(p.days ? { days: p.days } : {}),
          ...(p.completedAt ? { completedAt: p.completedAt } : {}),
        };
        return record;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30);
  });
}
