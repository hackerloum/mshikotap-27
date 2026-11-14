import { FieldValue } from "firebase-admin/firestore";
import { notify } from "@/lib/server/ledger";
import { amount, col, db, HttpError, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import { applyRisk, readSecurity } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";
import { ACTIVE_PAYOUT, evaluateEligibility, normalizeTzPhone } from "@/lib/server/withdrawals";
import type { Withdrawal, WithdrawalMethod } from "@/types";

export const runtime = "nodejs";

const methods: WithdrawalMethod[] = ["mobile_money", "bank_transfer", "paypal", "crypto"];

export async function GET(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const list = rows<Withdrawal>(
      await db().collection(col.withdrawals).where("userId", "==", uid).get(),
    );
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request);
    const settings = await getSettings();
    const body = await readJson<{ amount?: number; method?: string; destination?: string }>(request);
    const value = amount(body.amount, "Amount");
    if (!methods.includes(body.method as WithdrawalMethod)) {
      throw new HttpError(400, "INVALID_INPUT", "Pick a payout method");
    }
    const method = body.method as WithdrawalMethod;
    let destination = str(body.destination, "Destination", 120);
    if (method === "mobile_money") {
      const phone = normalizeTzPhone(destination);
      if (!phone) {
        throw new HttpError(400, "INVALID_INPUT", "Enter a Tanzanian mobile money number like 0712 345 678");
      }
      destination = phone;
    }
    if (value < settings.minWithdrawal) {
      throw new HttpError(
        400,
        "MIN_WITHDRAWAL",
        `Minimum cash out is TSh ${settings.minWithdrawal.toLocaleString("en-US")}`,
      );
    }

    const firestore = db();
    const [mine, sameDestination] = await Promise.all([
      firestore.collection(col.withdrawals).where("userId", "==", uid).get(),
      firestore.collection(col.withdrawals).where("destination", "==", destination).limit(10).get(),
    ]);
    const activePayouts = rows<Withdrawal>(mine).filter((w) => ACTIVE_PAYOUT.includes(w.status)).length;
    const sharedWithOthers = rows<Withdrawal>(sameDestination).some((w) => w.userId !== uid);
    const userRef = firestore.collection(col.users).doc(uid);

    return firestore.runTransaction(async (tx) => {
      const [userSnap, sec] = await Promise.all([tx.get(userRef), readSecurity(tx, firestore, uid)]);
      const fresh = { ...profile, wallet: { ...profile.wallet, ...(userSnap.data()?.wallet ?? {}) } };
      const { checks } = evaluateEligibility(fresh, sec, settings, activePayouts);
      const failed = checks.find((c) => !c.ok && c.key !== "balance");
      if (failed) throw new HttpError(403, "NOT_ELIGIBLE", `${failed.label}: ${failed.detail}`);

      const balance = fresh.wallet.balance ?? 0;
      if (value > balance) throw new HttpError(400, "INSUFFICIENT_FUNDS", "Not enough balance");

      const fee = Math.round((value * settings.withdrawalFeePercent) / 100);
      const ref = firestore.collection(col.withdrawals).doc();
      const withdrawal: Omit<Withdrawal, "id"> = {
        userId: uid,
        amount: value,
        fee,
        netAmount: value - fee,
        method,
        destination,
        status: sharedWithOthers ? "under_review" : "pending",
        createdAt: new Date().toISOString(),
        ...(sharedWithOthers ? { notes: "Payout number is also used by another account" } : {}),
      };
      tx.create(ref, withdrawal);
      tx.update(userRef, {
        "wallet.balance": FieldValue.increment(-value),
        "wallet.updatedAt": withdrawal.createdAt,
      });
      if (sharedWithOthers) {
        applyRisk(tx, firestore, uid, sec, 20, settings, {
          kind: "shared_payout_destination",
          severity: "high",
          detail: `Payout number ${destination.slice(0, 7)}… is used by another account`,
          entityId: ref.id,
        }, profile.isBanned);
      }
      notify(
        tx,
        firestore,
        uid,
        "Cash out requested",
        `TSh ${value.toLocaleString("en-US")} is waiting for review.`,
        "/user/withdraw",
      );
      return { id: ref.id, ...withdrawal };
    });
  }, 201);
}
