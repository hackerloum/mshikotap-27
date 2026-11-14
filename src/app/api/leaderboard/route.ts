import { NextResponse } from "next/server";
import { col, db, rows } from "@/lib/server/http";
import type { LeaderboardEntry, UserProfile } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snap = await db().collection(col.users).orderBy("gamification.xp", "desc").limit(30).get();
    const list: LeaderboardEntry[] = rows<UserProfile & { id: string }>(snap)
      .filter((u) => !u.isBanned && u.role === "user")
      .slice(0, 20)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        displayName: u.displayName,
        score: u.gamification.xp,
        level: u.gamification.level,
        avatarUrl: u.photoURL,
      }));
    return NextResponse.json({ ok: true, data: list });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "UNAVAILABLE", message: "Could not load the leaderboard" } },
      { status: 503 },
    );
  }
}
