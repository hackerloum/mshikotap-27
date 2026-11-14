import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const snap = await db().collection(col.users).orderBy("createdAt", "desc").limit(200).get();
    return rows<UserProfile & { id: string }>(snap).map((u) => ({
      uid: u.id,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      subscription: u.subscription,
      isBanned: u.isBanned,
      balance: u.wallet?.balance ?? 0,
      level: u.gamification?.level ?? 1,
      advertiserCredits: u.advertiserCredits ?? 0,
      createdAt: u.createdAt,
    }));
  });
}
