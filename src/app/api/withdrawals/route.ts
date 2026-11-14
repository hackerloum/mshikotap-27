import { FieldValue } from "firebase-admin/firestore";
import { siteConfig } from "@/config/site";
import { notify } from "@/lib/server/ledger";
import { amount, col, db, HttpError, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import type { Withdrawal, WithdrawalMethod } from "@/types";

export const runtime = "nodejs";

const methods: WithdrawalMethod[] = ["mobile_money", "bank_transfer", "paypal", "crypto"];

export async function GET(request: Request) {
  return respond(async () => {
    const scope = new URL(request.url).searchParams.get("scope");
    const { uid, profile } = await requireSession(request);

    let list: Withdrawal[];
    if (scope === "all") {
      if (profile.role !== "admin") throw new HttpError(403, "FORBIDDEN", "Admins only");
      list = rows<Withdrawal>(await db().collection(col.withdrawals).limit(300).get());
    } else {
      list = rows<Withdrawal>(
        await db().collection(col.withdrawals).where("userId", "==", uid).get(),
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const body = await readJson<{ amount?: number; method?: string; destination?: string }>(request);
    const value = amount(body.amount, "Amount");
    const destination = str(body.destination, "Destination", 120);
    if (!methods.includes(body.method as WithdrawalMethod)) {
      throw new HttpError(400, "INVALID_INPUT", "Pick a payout method");
    }
    if (value < siteConfig.minWithdrawal) {
      throw new HttpError(400, "MIN_WITHDRAWAL", `Minimum cash out is TSh ${siteConfig.minWithdrawal.toLocaleString("en-US")}`);
    }

    const firestore = db();
    const userRef = firestore.collection(col.users).doc(uid);

    return firestore.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const balance = (userSnap.data()?.wallet?.balance as number | undefined) ?? 0;
      if (value > balance) throw new HttpError(400, "INSUFFICIENT_FUNDS", "Not enough balance");

      const fee = Math.round((value * siteConfig.withdrawalFeePercent) / 100);
      const ref = firestore.collection(col.withdrawals).doc();
      const withdrawal: Omit<Withdrawal, "id"> = {
        userId: uid,
        amount: value,
        fee,
        netAmount: value - fee,
        method: body.method as WithdrawalMethod,
        destination,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      tx.create(ref, withdrawal);
      tx.update(userRef, {
        "wallet.balance": FieldValue.increment(-value),
        "wallet.updatedAt": withdrawal.createdAt,
      });
      notify(tx, firestore, uid, "Cash out requested", `TSh ${value.toLocaleString("en-US")} is waiting for review.`, "/user/withdraw");
      return { id: ref.id, ...withdrawal };
    });
  }, 201);
}
