import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import type { Campaign, UserProfile } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const firestore = db();
    const list = rows<Campaign>(await firestore.collection(col.campaigns).limit(300).get());
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const ids = [...new Set(list.map((c) => c.advertiserId))];
    const docs = ids.length ? await firestore.getAll(...ids.map((id) => firestore.collection(col.users).doc(id))) : [];
    const names = new Map(
      docs.map((d) => [d.id, d.exists ? (d.data() as UserProfile).displayName : "Unknown advertiser"]),
    );
    return list.map((c) => ({ ...c, advertiserName: names.get(c.advertiserId) ?? "Unknown advertiser" }));
  });
}
