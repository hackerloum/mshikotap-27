import "server-only";
import { NextResponse } from "next/server";
import type { DocumentData, QuerySnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/server/auth";
import type { UserProfile, UserRole } from "@/types";

export class HttpError extends Error {
  status: number;
  code: string;
  extra?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export type Session = { uid: string; profile: UserProfile };

export const col = {
  users: "users",
  tasks: "tasks",
  submissions: "taskSubmissions",
  withdrawals: "withdrawals",
  campaigns: "campaigns",
  challenges: "challenges",
  listings: "marketplaceListings",
  notifications: "notifications",
  earnings: "earningsDaily",
  sessions: "questSessions",
  limits: "dailyLimits",
  proofs: "proofIndex",
  security: "userSecurity",
  flags: "fraudFlags",
  audit: "auditLogs",
} as const;

export function db() {
  const instance = getAdminDb();
  if (!instance) throw new HttpError(503, "DB_UNAVAILABLE", "The server database is not configured");
  return instance;
}

export async function requireSession(request: Request, roles?: UserRole[]): Promise<Session> {
  const decoded = await verifyRequest(request);
  if (!decoded) throw new HttpError(401, "UNAUTHENTICATED", "Sign in again");

  const snap = await db().collection(col.users).doc(decoded.uid).get();
  if (!snap.exists) throw new HttpError(404, "NO_PROFILE", "Profile not found. Sign in again.");

  const profile = { ...(snap.data() as UserProfile), uid: decoded.uid };
  if (profile.isBanned) throw new HttpError(403, "BANNED", "This account is suspended");
  if (roles && !roles.includes(profile.role)) {
    throw new HttpError(403, "FORBIDDEN", "You do not have access to this");
  }
  return { uid: decoded.uid, profile };
}

export function rows<T>(snap: QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "BAD_JSON", "Invalid request body");
  }
}

export async function respond<T>(fn: () => Promise<T>, status = 200) {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, data }, { status });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message, ...error.extra } },
        { status: error.status },
      );
    }
    console.error("[api]", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Try again." } },
      { status: 500 },
    );
  }
}

export function str(value: unknown, field: string, max = 500) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, "INVALID_INPUT", `${field} is required`);
  }
  return value.trim().slice(0, max);
}

export function optStr(value: unknown, max = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

export function amount(value: unknown, field: string) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, "INVALID_INPUT", `${field} must be a positive number`);
  }
  return Math.round(n);
}

export function httpUrl(value: unknown, field: string, required = false) {
  const raw = optStr(value, 600);
  if (!raw) {
    if (required) throw new HttpError(400, "INVALID_INPUT", `${field} is required`);
    return undefined;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
    return url.toString();
  } catch {
    throw new HttpError(400, "INVALID_INPUT", `${field} must be a valid link starting with https://`);
  }
}

export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}
