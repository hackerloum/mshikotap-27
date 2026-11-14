import { col, dayKey, db, requireSession, respond } from "@/lib/server/http";
import type { EarningsPoint } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond<EarningsPoint[]>(async () => {
    const { uid } = await requireSession(request);
    const firestore = db();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (13 - i));
      return d;
    });
    const refs = days.map((d) => firestore.collection(col.earnings).doc(`${uid}_${dayKey(d)}`));
    const snaps = await firestore.getAll(...refs);
    return days.map((d, i) => ({
      date: d.toISOString().slice(0, 10),
      amount: Number(snaps[i].data()?.amount ?? 0),
    }));
  });
}
