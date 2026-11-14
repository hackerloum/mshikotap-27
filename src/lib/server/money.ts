import "server-only";
import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { col, HttpError } from "@/lib/server/http";
import { notify } from "@/lib/server/ledger";
import type { PaymentKind, PaymentStatus, UserProfile } from "@/types";

export type PaymentDoc = {
  uid: string;
  email?: string;
  kind: PaymentKind;
  amount: number;
  days?: number;
  status: PaymentStatus;
  sessionRef?: string;
  checkoutUrl?: string;
  providerRef?: string;
  feeAmount?: number;
  note?: string;
  createdAt: string;
  completedAt?: string;
};

export type LedgerType =
  | "topup"
  | "premium"
  | "campaign_fund"
  | "campaign_refund"
  | "admin_adjust";

export function isPremium(profile: Pick<UserProfile, "subscription" | "premiumUntil">, now = Date.now()) {
  return (
    profile.subscription === "premium" &&
    Boolean(profile.premiumUntil) &&
    new Date(profile.premiumUntil as string).getTime() > now
  );
}

export function premiumFactor(profile: Pick<UserProfile, "subscription" | "premiumUntil">, multiplier: number) {
  return isPremium(profile) ? Math.max(1, multiplier) : 1;
}

export function ledgerInTx(
  tx: Transaction,
  db: Firestore,
  entry: { uid: string; type: LedgerType; amount: number; ref?: string; note: string },
) {
  tx.create(db.collection(col.money).doc(), { ...entry, createdAt: new Date().toISOString() });
}

export type FulfilResult = "completed" | "already" | "mismatch" | "missing";

/** Credits a paid order exactly once. Safe to call from the webhook and from the status poll. */
export async function fulfilPayment(
  db: Firestore,
  paymentId: string,
  paid: { amount: number; providerRef?: string; feeAmount?: number },
): Promise<FulfilResult> {
  const paymentRef = db.collection(col.payments).doc(paymentId);

  return db.runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef);
    if (!paymentSnap.exists) return "missing" as const;
    const payment = paymentSnap.data() as PaymentDoc;
    if (payment.status === "completed") return "already" as const;

    const userRef = db.collection(col.users).doc(payment.uid);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return "missing" as const;
    const user = userSnap.data() as UserProfile;

    if (paid.amount < payment.amount) {
      tx.update(paymentRef, {
        status: "mismatch",
        note: `Paid ${paid.amount} but ${payment.amount} was expected`,
        providerRef: paid.providerRef ?? null,
      });
      return "mismatch" as const;
    }

    const now = new Date();
    const stamp = now.toISOString();
    const base = {
      status: "completed" as const,
      completedAt: stamp,
      providerRef: paid.providerRef ?? null,
      feeAmount: paid.feeAmount ?? null,
    };

    if (payment.kind === "topup") {
      tx.update(userRef, { advertiserCredits: FieldValue.increment(payment.amount), updatedAt: stamp });
      ledgerInTx(tx, db, {
        uid: payment.uid,
        type: "topup",
        amount: payment.amount,
        ref: paymentId,
        note: `Top-up of TSh ${payment.amount}`,
      });
      notify(tx, db, payment.uid, "Credits added", `TSh ${payment.amount.toLocaleString("en-US")} is ready to fund your quests.`, "/advertiser/credits");
    } else {
      const days = payment.days ?? 30;
      const current = user.premiumUntil ? new Date(user.premiumUntil).getTime() : 0;
      const start = Math.max(now.getTime(), current);
      const until = new Date(start + days * 86_400_000).toISOString();
      tx.update(userRef, { subscription: "premium", premiumUntil: until, updatedAt: stamp });
      ledgerInTx(tx, db, {
        uid: payment.uid,
        type: "premium",
        amount: payment.amount,
        ref: paymentId,
        note: `Premium for ${days} days`,
      });
      notify(tx, db, payment.uid, "You are Premium", `Premium is active until ${until.slice(0, 10)}. Enjoy the bigger limits and bonuses.`, "/user/premium");
    }

    tx.update(paymentRef, base);
    return "completed" as const;
  });
}

export function assertAmount(value: unknown, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, "INVALID_AMOUNT", `Pick an amount between TSh ${min.toLocaleString("en-US")} and TSh ${max.toLocaleString("en-US")}`);
  }
  return n;
}
