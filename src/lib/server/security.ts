import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { col } from "@/lib/server/http";
import type { FlagKind, SystemSettings } from "@/config/system";

export type Fingerprint = { ipHash?: string; deviceHash?: string };

export type Severity = "low" | "medium" | "high";

export interface SecurityDoc {
  riskScore: number;
  flagCount: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  referralPaidCount: number;
  ipHashes: string[];
  deviceHashes: string[];
  trusted: boolean;
}

export interface FraudFlag {
  id: string;
  userId: string;
  kind: FlagKind;
  severity: Severity;
  detail: string;
  points: number;
  entityId?: string;
  status: "open" | "confirmed" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

const hash = (value: string) =>
  createHash("sha256")
    .update(`${process.env.IP_HASH_SALT || process.env.FIREBASE_ADMIN_PROJECT_ID || "mshikotap"}:${value}`)
    .digest("hex")
    .slice(0, 24);

export function fingerprint(request: Request): Fingerprint {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || undefined;
  const device = request.headers.get("x-device-id")?.trim();
  return {
    ipHash: ip ? hash(`ip:${ip}`) : undefined,
    deviceHash: device && /^[a-zA-Z0-9-]{16,64}$/.test(device) ? hash(`dev:${device}`) : undefined,
  };
}

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|igshid|si$|ref$)/i;

export function normalizeUrl(raw: string) {
  const url = new URL(raw);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return `${url.hostname}${url.pathname.replace(/\/+$/, "")}${url.search}`;
}

export function proofKey(raw: string) {
  return createHash("sha256").update(normalizeUrl(raw)).digest("hex").slice(0, 40);
}

export function emptySecurity(): SecurityDoc {
  return {
    riskScore: 0,
    flagCount: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    referralPaidCount: 0,
    ipHashes: [],
    deviceHashes: [],
    trusted: false,
  };
}

export function toSecurity(data: Record<string, unknown> | undefined): SecurityDoc {
  const base = emptySecurity();
  if (!data) return base;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    riskScore: num(data.riskScore),
    flagCount: num(data.flagCount),
    submittedCount: num(data.submittedCount),
    approvedCount: num(data.approvedCount),
    rejectedCount: num(data.rejectedCount),
    referralPaidCount: num(data.referralPaidCount),
    ipHashes: list(data.ipHashes),
    deviceHashes: list(data.deviceHashes),
    trusted: data.trusted === true,
  };
}

export function securityRef(db: Firestore, uid: string) {
  return db.collection(col.security).doc(uid);
}

export async function readSecurity(tx: Transaction, db: Firestore, uid: string) {
  const snap = await tx.get(securityRef(db, uid));
  return toSecurity(snap.exists ? (snap.data() as Record<string, unknown>) : undefined);
}

export async function loadSecurity(db: Firestore, uid: string) {
  const snap = await securityRef(db, uid).get();
  return toSecurity(snap.exists ? (snap.data() as Record<string, unknown>) : undefined);
}

export type FlagInput = {
  kind: FlagKind;
  severity: Severity;
  detail: string;
  entityId?: string;
};

/**
 * Adds (or removes) risk points and optionally records a fraud flag. Writes only:
 * pass a SecurityDoc that was read earlier in the same transaction. The passed
 * object is updated so several calls in one transaction accumulate correctly.
 */
export function applyRisk(
  tx: Transaction,
  db: Firestore,
  uid: string,
  sec: SecurityDoc,
  points: number,
  settings: SystemSettings,
  flag?: FlagInput,
  alreadyBanned = false,
): { banned: boolean } {
  const now = new Date().toISOString();
  sec.riskScore = Math.max(0, sec.riskScore + points);
  const update: Record<string, unknown> = { riskScore: sec.riskScore, updatedAt: now };

  if (flag) {
    sec.flagCount += 1;
    update.flagCount = FieldValue.increment(1);
    tx.create(db.collection(col.flags).doc(), {
      userId: uid,
      kind: flag.kind,
      severity: flag.severity,
      detail: flag.detail.slice(0, 300),
      points,
      ...(flag.entityId ? { entityId: flag.entityId } : {}),
      status: "open",
      createdAt: now,
    });
  }
  tx.set(securityRef(db, uid), update, { merge: true });

  if (!alreadyBanned && !sec.trusted && points > 0 && sec.riskScore >= settings.autoBanRiskScore) {
    tx.update(db.collection(col.users).doc(uid), {
      isBanned: true,
      banReason: "Suspended automatically: too many suspicious actions",
      updatedAt: now,
    });
    tx.create(db.collection(col.flags).doc(), {
      userId: uid,
      kind: "auto_suspended",
      severity: "high",
      detail: `Risk score reached ${sec.riskScore}`,
      points: 0,
      status: "open",
      createdAt: now,
    });
    return { banned: true };
  }
  return { banned: false };
}

/** Records the sign-in fingerprint and flags a device already used by another account. */
export async function touchSecurity(
  db: Firestore,
  uid: string,
  fp: Fingerprint,
  settings: SystemSettings,
  alreadyBanned: boolean,
) {
  if (!fp.ipHash && !fp.deviceHash) return;
  await db.runTransaction(async (tx) => {
    const sec = await readSecurity(tx, db, uid);
    const newIp = fp.ipHash && !sec.ipHashes.includes(fp.ipHash) ? fp.ipHash : undefined;
    const newDevice = fp.deviceHash && !sec.deviceHashes.includes(fp.deviceHash) ? fp.deviceHash : undefined;
    if (!newIp && !newDevice) return;

    let others: string[] = [];
    if (newDevice) {
      const shared = await tx.get(
        db.collection(col.security).where("deviceHashes", "array-contains", newDevice).limit(6),
      );
      others = shared.docs.map((d) => d.id).filter((id) => id !== uid);
    }

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (newIp) patch.ipHashes = [...sec.ipHashes, newIp].slice(-10);
    if (newDevice) patch.deviceHashes = [...sec.deviceHashes, newDevice].slice(-10);
    tx.set(securityRef(db, uid), patch, { merge: true });

    if (others.length > 0) {
      applyRisk(
        tx,
        db,
        uid,
        sec,
        20,
        settings,
        {
          kind: "multi_account_device",
          severity: others.length >= 2 ? "high" : "medium",
          detail: `This device is also used by ${others.length} other account${others.length > 1 ? "s" : ""}`,
        },
        alreadyBanned,
      );
    }
  });
}
