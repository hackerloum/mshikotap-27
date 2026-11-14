import { col, dayKey, db, requireSession, respond, rows } from "@/lib/server/http";
import type { Campaign, Task } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const firestore = db();

    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (13 - i));
      return d;
    });
    const since = dayKey(days[0]);

    const [users, pendingReviews, pendingPayouts, earnings, tasks, campaigns] = await Promise.all([
      firestore.collection(col.users).count().get(),
      firestore.collection(col.submissions).where("status", "==", "submitted").count().get(),
      firestore.collection(col.withdrawals).where("status", "in", ["pending", "under_review"]).count().get(),
      firestore.collection(col.earnings).where("day", ">=", since).get(),
      firestore.collection(col.tasks).limit(500).get(),
      firestore.collection(col.campaigns).limit(500).get(),
    ]);

    const perDay = new Map<string, number>();
    earnings.docs.forEach((doc) => {
      const day = doc.data().day as string;
      perDay.set(day, (perDay.get(day) ?? 0) + Number(doc.data().amount ?? 0));
    });
    const series = days.map((d) => ({
      date: d.toISOString().slice(0, 10),
      amount: perDay.get(dayKey(d)) ?? 0,
    }));

    const byCategory = new Map<string, number>();
    rows<Task>(tasks).forEach((t) => byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + (t.completions ?? 0)));

    return {
      users: users.data().count,
      pendingReviews: pendingReviews.data().count,
      pendingPayouts: pendingPayouts.data().count,
      series,
      categories: [...byCategory.entries()].map(([category, completions]) => ({ category, completions })),
      campaignSpend: rows<Campaign>(campaigns).reduce((sum, c) => sum + (c.spentCredits ?? 0), 0),
    };
  });
}
