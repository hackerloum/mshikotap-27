import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/server/auth";
import { ensureProfile } from "@/lib/server/profile";

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

  const { profile, persisted } = await ensureProfile(decoded, referral);

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

  return NextResponse.json({ ok: true, data: { profile, persisted } });
}
