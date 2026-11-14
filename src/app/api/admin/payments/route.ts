import { AggregateField } from "firebase-admin/firestore";
import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import type { PaymentDoc } from "@/lib/server/money";
import type { Campaign, PaymentRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const firestore = db();
    const [snap, held, campaigns] = await Promise.all([
      firestore.collection(col.payments).orderBy("createdAt", "desc").limit(200).get(),
      firestore.collection(col.users).aggregate({ credits: AggregateField.sum("advertiserCredits") }).get(),
      firestore.collection(col.campaigns).limit(500).get(),
    ]);

    const items = snap.docs.map((d) => {
      const p = d.data() as PaymentDoc;
      const item: PaymentRecord = {
        id: d.id,
        uid: p.uid,
        email: p.email,
        kind: p.kind,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        ...(p.days ? { days: p.days } : {}),
        ...(p.completedAt ? { completedAt: p.completedAt } : {}),
      };
      return item;
    });

    const paid = items.filter((p) => p.status === "completed");
    const sum = (list: PaymentRecord[]) => list.reduce((total, p) => total + p.amount, 0);
    const monthAgo = Date.now() - 30 * 86_400_000;
    const recent = paid.filter((p) => new Date(p.completedAt ?? p.createdAt).getTime() > monthAgo);

    const margin = rows<Campaign>(campaigns).reduce((total, c) => {
      const reward = c.playerReward ?? Math.floor(c.costPerAction * 0.7);
      return total + Math.max(0, (c.spentCredits ?? 0) - (c.completions ?? 0) * reward);
    }, 0);

    return {
      summary: {
        moneyIn: sum(paid),
        moneyIn30d: sum(recent),
        topups: sum(paid.filter((p) => p.kind === "topup")),
        premium: sum(paid.filter((p) => p.kind === "premium")),
        premiumSales: paid.filter((p) => p.kind === "premium").length,
        advertiserBalances: Number(held.data().credits ?? 0),
        campaignMargin: margin,
        pending: items.filter((p) => p.status === "pending").length,
        mismatches: items.filter((p) => p.status === "mismatch").length,
      },
      items,
    };
  });
}
