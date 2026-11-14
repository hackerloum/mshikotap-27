import { col, db, readJson, requireSession, respond, rows } from "@/lib/server/http";
import type { AppNotification } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const snap = await db().collection(col.notifications).where("userId", "==", uid).limit(100).get();
    return rows<AppNotification>(snap)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
  });
}

export async function PATCH(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const body = await readJson<{ id?: string; all?: boolean }>(request);
    const firestore = db();

    if (body.all) {
      const snap = await firestore
        .collection(col.notifications)
        .where("userId", "==", uid)
        .where("read", "==", false)
        .get();
      const batch = firestore.batch();
      snap.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
      await batch.commit();
      return { count: snap.size };
    }

    if (!body.id) return { count: 0 };
    const ref = firestore.collection(col.notifications).doc(body.id);
    const snap = await ref.get();
    if (snap.exists && snap.data()?.userId === uid) await ref.update({ read: true });
    return { count: 1 };
  });
}
