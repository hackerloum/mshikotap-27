import { col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";
import { assertAmount, type PaymentDoc } from "@/lib/server/money";
import { appUrl, createSession, snippeConfigured } from "@/lib/server/snippe";
import { getSettings } from "@/lib/server/settings";
import type { PaymentKind } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["user", "advertiser", "admin"]);
    const body = await readJson<{ kind?: string; amount?: unknown }>(request);
    const kind = body.kind as PaymentKind;
    if (kind !== "topup" && kind !== "premium") throw new HttpError(400, "INVALID_INPUT", "Choose what you want to pay for");
    if (!snippeConfigured()) throw new HttpError(503, "PAYMENTS_OFF", "Payments are not switched on yet. Please try again soon.");

    const settings = await getSettings();
    if (kind === "topup" && profile.role !== "advertiser" && profile.role !== "admin") {
      throw new HttpError(403, "FORBIDDEN", "Only advertiser accounts can add credits");
    }
    const amount = kind === "premium" ? settings.premiumPrice : assertAmount(body.amount, settings.minTopUp, settings.maxTopUp);

    const firestore = db();
    const recent = await firestore.collection(col.payments).where("uid", "==", uid).get();
    const since = Date.now() - 3_600_000;
    const open = recent.docs.filter((d) => {
      const p = d.data() as PaymentDoc;
      return p.status === "pending" && new Date(p.createdAt).getTime() > since;
    });
    const reusable = open.find((d) => {
      const p = d.data() as PaymentDoc;
      return p.kind === kind && p.amount === amount && p.checkoutUrl;
    });
    if (reusable) {
      const p = reusable.data() as PaymentDoc;
      return { id: reusable.id, checkoutUrl: p.checkoutUrl as string };
    }
    if (open.length >= 5) {
      throw new HttpError(429, "TOO_MANY_PENDING", "You already have several unfinished payments. Finish or wait for them to expire.");
    }

    const ref = firestore.collection(col.payments).doc();
    const now = new Date().toISOString();
    const doc: PaymentDoc = {
      uid,
      email: profile.email,
      kind,
      amount,
      status: "pending",
      createdAt: now,
      ...(kind === "premium" ? { days: settings.premiumDays } : {}),
    };
    await ref.set(doc);

    try {
      const session = await createSession({
        amount,
        description: kind === "premium" ? `MshikoTap Premium (${settings.premiumDays} days)` : "MshikoTap advertiser credits",
        metadata: { payment_id: ref.id, uid, kind },
        redirectUrl: `${appUrl()}/payment/return?p=${ref.id}`,
        webhookUrl: `${appUrl()}/api/webhooks/snippe`,
        customer: { name: profile.displayName, email: profile.email || undefined },
      });
      await ref.update({ sessionRef: session.reference, checkoutUrl: session.checkoutUrl });
      return { id: ref.id, checkoutUrl: session.checkoutUrl as string };
    } catch (error) {
      await ref.update({ status: "failed", note: "Could not open checkout" }).catch(() => undefined);
      throw error;
    }
  }, 201);
}
