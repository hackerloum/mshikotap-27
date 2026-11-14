import "server-only";
import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { col, dayKey } from "@/lib/server/http";

/** Adds a positive earning to the per-user daily rollup used by charts. */
export function bumpEarnings(tx: Transaction, db: Firestore, uid: string, value: number, now = new Date()) {
  const day = dayKey(now);
  tx.set(
    db.collection(col.earnings).doc(`${uid}_${day}`),
    { userId: uid, day, amount: FieldValue.increment(value) },
    { merge: true },
  );
}

export function notify(
  tx: Transaction,
  db: Firestore,
  userId: string,
  title: string,
  body: string,
  href?: string,
) {
  tx.set(db.collection(col.notifications).doc(), {
    userId,
    title,
    body,
    channel: "in_app",
    read: false,
    ...(href ? { href } : {}),
    createdAt: new Date().toISOString(),
  });
}
