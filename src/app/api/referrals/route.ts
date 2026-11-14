import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import type { ReferralStats, UserProfile } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond<ReferralStats>(async () => {
    const { profile } = await requireSession(request);
    const snap = await db().collection(col.users).where("referredBy", "==", profile.referralCode).limit(500).get();
    const friends = rows<UserProfile>(snap);
    return {
      code: profile.referralCode,
      totalReferrals: friends.length,
      activeReferrals: friends.filter((f) => f.wallet.lifetimeEarnings > 0).length,
      earnings: Number((profile as UserProfile & { referralEarnings?: number }).referralEarnings ?? 0),
      rank: 0,
    };
  });
}
