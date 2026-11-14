import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/server/http";
import { fulfilPayment, type PaymentDoc } from "@/lib/server/money";
import { verifyWebhook } from "@/lib/server/snippe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Event = {
  type?: string;
  data?: {
    reference?: string;
    session_reference?: string;
    amount?: { value?: number };
    settlement?: { fees?: { value?: number } };
    metadata?: Record<string, unknown>;
  };
};

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const data = event.data ?? {};
    let paymentId = typeof data.metadata?.payment_id === "string" ? data.metadata.payment_id : undefined;
    if (!paymentId && data.session_reference) {
      const found = await db.collection(col.payments).where("sessionRef", "==", data.session_reference).limit(1).get();
      paymentId = found.docs[0]?.id;
    }
    if (!paymentId) return NextResponse.json({ ok: true, ignored: true });

    if (event.type === "payment.completed") {
      await fulfilPayment(db, paymentId, {
        amount: data.amount?.value ?? 0,
        providerRef: data.reference,
        feeAmount: data.settlement?.fees?.value,
      });
    } else if (event.type === "payment.failed" || event.type === "payment.voided" || event.type === "payment.expired") {
      const ref = db.collection(col.payments).doc(paymentId);
      const snap = await ref.get();
      if (snap.exists && (snap.data() as PaymentDoc).status === "pending") {
        const status = event.type === "payment.expired" ? "expired" : event.type === "payment.voided" ? "voided" : "failed";
        await ref.update({ status });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[snippe webhook] failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
