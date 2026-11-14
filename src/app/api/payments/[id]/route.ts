import { col, db, HttpError, requireSession, respond } from "@/lib/server/http";
import { fulfilPayment, type PaymentDoc } from "@/lib/server/money";
import { getSession } from "@/lib/server/snippe";
import type { PaymentRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicPayment(id: string, p: PaymentDoc): PaymentRecord {
  return {
    id,
    uid: p.uid,
    kind: p.kind,
    amount: p.amount,
    status: p.status,
    createdAt: p.createdAt,
    ...(p.days ? { days: p.days } : {}),
    ...(p.completedAt ? { completedAt: p.completedAt } : {}),
    ...(p.status === "pending" && p.checkoutUrl ? { checkoutUrl: p.checkoutUrl } : {}),
  };
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request);
    const { id } = await ctx.params;
    const ref = db().collection(col.payments).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Payment not found");
    let payment = snap.data() as PaymentDoc;
    if (payment.uid !== uid && profile.role !== "admin") throw new HttpError(404, "NOT_FOUND", "Payment not found");

    if (payment.status === "pending" && payment.sessionRef) {
      const session = await getSession(payment.sessionRef);
      if (session?.status === "completed") {
        await fulfilPayment(db(), id, { amount: session.amount || payment.amount });
      } else if (session && ["expired", "cancelled"].includes(session.status)) {
        await ref.update({ status: session.status === "expired" ? "expired" : "voided" });
      }
      payment = (await ref.get()).data() as PaymentDoc;
    }
    return publicPayment(id, payment);
  });
}
