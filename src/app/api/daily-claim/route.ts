import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/server/auth";
import { bumpEarnings } from "@/lib/server/ledger";
import { levelFromXp } from "@/lib/utils";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";

const COOLDOWN_MS = 20 * 60 * 60 * 1000;
const STREAK_BREAK_MS = 48 * 60 * 60 * 1000;

function fail(status: number, code: string, message: string, extra?: object) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...extra } },
    { status },
  );
}

export async function POST(request: Request) {
  const decoded = await verifyRequest(request);
  if (!decoded) return fail(401, "UNAUTHENTICATED", "Sign in again");

  const db = getAdminDb();
  if (!db) return fail(503, "DB_UNAVAILABLE", "Rewards are warming up. Try again soon.");

  const ref = db.collection("users").doc(decoded.uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { error: fail(404, "NO_PROFILE", "Profile not found") };

      const profile = snap.data() as UserProfile;
      if (profile.isBanned) return { error: fail(403, "BANNED", "Account suspended") };

      const now = Date.now();
      const last = profile.gamification.lastDailyClaimAt
        ? new Date(profile.gamification.lastDailyClaimAt).getTime()
        : 0;

      if (last && now - last < COOLDOWN_MS) {
        return {
          error: fail(429, "TOO_SOON", "Daily reward already claimed", {
            nextClaimAt: new Date(last + COOLDOWN_MS).toISOString(),
          }),
        };
      }

      const streak = last && now - last < STREAK_BREAK_MS ? profile.gamification.streakDays + 1 : 1;
      const bonusSteps = Math.min(streak, 7);
      const reward = 100 + bonusSteps * 50;
      const xpGain = 10 + bonusSteps * 2;
      const xp = profile.gamification.xp + xpGain;
      const stamp = new Date(now).toISOString();

      const gamification = {
        ...profile.gamification,
        xp,
        level: levelFromXp(xp),
        streakDays: streak,
        longestStreak: Math.max(profile.gamification.longestStreak, streak),
        lastDailyClaimAt: stamp,
      };
      const wallet = {
        ...profile.wallet,
        balance: profile.wallet.balance + reward,
        lifetimeEarnings: profile.wallet.lifetimeEarnings + reward,
        updatedAt: stamp,
      };

      tx.update(ref, { gamification, wallet, updatedAt: stamp });
      bumpEarnings(tx, db, decoded.uid, reward, new Date(now));

      return {
        data: {
          reward,
          xpGain,
          levelUp: gamification.level > profile.gamification.level,
          profile: { ...profile, gamification, wallet, updatedAt: stamp },
        },
      };
    });

    if ("error" in result && result.error) return result.error;
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[daily-claim]", error);
    return fail(500, "CLAIM_FAILED", "Could not claim right now");
  }
}
