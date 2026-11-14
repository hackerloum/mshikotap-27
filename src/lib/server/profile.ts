import "server-only";
import { createHash } from "node:crypto";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile } from "@/types";

const USERS = "users";

function referralCodeFor(uid: string) {
  const hash = createHash("sha256").update(uid).digest("base64url");
  return `MT${hash.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;
}

function sanitizeReferral(code: string | null | undefined, uid: string) {
  if (!code) return undefined;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  if (clean.length < 4 || clean === referralCodeFor(uid)) return undefined;
  return clean;
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function newProfile(
  decoded: DecodedIdToken,
  referral?: string | null,
): UserProfile {
  const now = new Date().toISOString();
  const email = decoded.email || "";
  const isAdmin = email ? adminEmails().includes(email.toLowerCase()) : false;

  return {
    uid: decoded.uid,
    email,
    displayName: decoded.name || email.split("@")[0] || "Player",
    photoURL: decoded.picture,
    role: isAdmin ? "admin" : "user",
    referralCode: referralCodeFor(decoded.uid),
    referredBy: sanitizeReferral(referral, decoded.uid),
    subscription: "free",
    wallet: {
      balance: 0,
      pendingBalance: 0,
      lifetimeEarnings: 0,
      currency: "TZS",
      updatedAt: now,
    },
    gamification: {
      xp: 0,
      level: 1,
      streakDays: 0,
      longestStreak: 0,
      badges: [],
    },
    isBanned: false,
    deviceIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

function stripUndefined<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function ensureProfile(
  decoded: DecodedIdToken,
  referral?: string | null,
  options: { allowSignup?: boolean } = {},
): Promise<{ profile: UserProfile; persisted: boolean; signupsClosed?: boolean }> {
  const fresh = newProfile(decoded, referral);
  const db = getAdminDb();
  if (!db) return { profile: fresh, persisted: false };

  try {
    const ref = db.collection(USERS).doc(decoded.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      if (options.allowSignup === false) return { profile: fresh, persisted: false, signupsClosed: true };
      await ref.set(stripUndefined(fresh));
      return { profile: fresh, persisted: true };
    }

    const stored = { ...(snap.data() as UserProfile), uid: decoded.uid };
    const shouldBeAdmin =
      Boolean(stored.email) && adminEmails().includes(stored.email.toLowerCase());

    if (shouldBeAdmin && stored.role !== "admin") {
      stored.role = "admin";
      await ref.update({ role: "admin" });
    }
    if (!stored.photoURL && decoded.picture) {
      stored.photoURL = decoded.picture;
      await ref.update({ photoURL: decoded.picture });
    }

    return { profile: stored, persisted: true };
  } catch (error) {
    console.error("[profile] Firestore unavailable, using transient profile", error);
    return { profile: fresh, persisted: false };
  }
}
