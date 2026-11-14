import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { ensureProfile } from "@/lib/server/profile";
import { fingerprint, touchSecurity } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyRequest(request);
  if (!decoded) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in again" } },
      { status: 401 },
    );
  }

  let referral: string | undefined;
  try {
    const body = (await request.json()) as { referral?: string };
    referral = body.referral;
  } catch {
    referral = undefined;
  }

  const settings = await getSettings();
  const { profile, persisted, signupsClosed } = await ensureProfile(decoded, referral, {
    allowSignup: settings.signupsOpen,
  });

  if (signupsClosed) {
    return NextResponse.json(
      { ok: false, error: { code: "SIGNUPS_CLOSED", message: "New sign-ups are paused for now. Check back soon." } },
      { status: 403 },
    );
  }

  if (!persisted) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_UNAVAILABLE", message: "We are still setting things up. Try again in a minute." } },
      { status: 503 },
    );
  }

  if (profile.isBanned) {
    return NextResponse.json(
      { ok: false, error: { code: "BANNED", message: "This account is suspended" } },
      { status: 403 },
    );
  }

  const db = getAdminDb();
  if (db) {
    try {
      await touchSecurity(db, profile.uid, fingerprint(request), settings, profile.isBanned);
    } catch (error) {
      console.error("[me] security touch failed", error);
    }
  }

  return NextResponse.json({ ok: true, data: { profile, persisted } });
}
