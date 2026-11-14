import { FieldValue } from "firebase-admin/firestore";
import { notify } from "@/lib/server/ledger";
import { col, db, HttpError, optStr, readJson, requireSession, respond } from "@/lib/server/http";
import type { Withdrawal, WithdrawalStatus } from "@/types";

export const runtime = "nodejs";

const allowed: WithdrawalStatus[] = ["under_review", "approved", "processing", "completed", "rejected"];
const closed: WithdrawalStatus[] = ["completed", "rejected", "cancelled"];

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ status?: string; notes?: string }>(request);
    if (!allowed.includes(body.status as WithdrawalStatus)) {
      throw new HttpError(400, "INVALID_INPUT", "Unknown status");
    }
    const status = body.status as WithdrawalStatus;
    const notes = optStr(body.notes, 300);

    const firestore = db();
    const ref = firestore.collection(col.withdrawals).doc(id);

    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Withdrawal not found");
      const current = { ...(snap.data() as Withdrawal), id };
      if (closed.includes(current.status)) {
        throw new HttpError(409, "CLOSED", "This payout is already finished");
      }

      const stamp = new Date().toISOString();
      tx.update(ref, { status, processedAt: stamp, ...(notes ? { notes } : {}) });

      if (status === "rejected") {
        tx.update(firestore.collection(col.users).doc(current.userId), {
          "wallet.balance": FieldValue.increment(current.amount),
          "wallet.updatedAt": stamp,
        });
      }
      if (status === "completed" || status === "rejected") {
        notify(
          tx,
          firestore,
          current.userId,
          status === "completed" ? "Payout sent" : "Payout rejected",
          status === "completed"
            ? `TSh ${current.netAmount.toLocaleString("en-US")} is on its way to ${current.destination}.`
            : `Your TSh ${current.amount.toLocaleString("en-US")} was returned to your wallet.${notes ? ` ${notes}` : ""}`,
          "/user/withdraw",
        );
      }
      return { ...current, status, processedAt: stamp, notes };
    });
  });
}
