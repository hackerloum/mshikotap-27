import { riskLevel } from "@/config/system";
import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { toSecurity } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const settings = await getSettings();
    const firestore = db();
    const snap = await firestore.collection(col.users).orderBy("createdAt", "desc").limit(300).get();
    const users = rows<UserProfile & { id: string }>(snap);
    const secDocs = users.length
      ? await firestore.getAll(...users.map((u) => firestore.collection(col.security).doc(u.id)))
      : [];

    return users.map((u, i) => {
      const sec = toSecurity(secDocs[i].exists ? (secDocs[i].data() as Record<string, unknown>) : undefined);
      return {
        uid: u.id,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        subscription: u.subscription,
        isBanned: u.isBanned,
        balance: u.wallet?.balance ?? 0,
        pendingBalance: u.wallet?.pendingBalance ?? 0,
        level: u.gamification?.level ?? 1,
        advertiserCredits: u.advertiserCredits ?? 0,
        createdAt: u.createdAt,
        riskScore: sec.riskScore,
        risk: sec.trusted ? "low" : riskLevel(sec.riskScore, settings.holdRiskScore),
        trusted: sec.trusted,
        approved: sec.approvedCount,
      };
    });
  });
}
