import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { riskLevel, type RiskLevel } from "@/config/system";
import { col } from "@/lib/server/http";
import { toSecurity } from "@/lib/server/security";
import type { UserProfile } from "@/types";

export interface PlayerContext {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt?: string;
  accountAgeHours: number;
  isBanned: boolean;
  riskScore: number;
  risk: RiskLevel;
  trusted: boolean;
  approved: number;
  rejected: number;
  submitted: number;
}

export async function playerContext(db: Firestore, uids: string[], hold: number) {
  const unique = [...new Set(uids)];
  const map = new Map<string, PlayerContext>();
  if (unique.length === 0) return map;

  const [users, securities] = await Promise.all([
    db.getAll(...unique.map((id) => db.collection(col.users).doc(id))),
    db.getAll(...unique.map((id) => db.collection(col.security).doc(id))),
  ]);

  unique.forEach((uid, i) => {
    const user = users[i].exists ? (users[i].data() as UserProfile) : undefined;
    const sec = toSecurity(securities[i].exists ? (securities[i].data() as Record<string, unknown>) : undefined);
    map.set(uid, {
      uid,
      name: user?.displayName ?? "Deleted player",
      email: user?.email ?? "",
      photoURL: user?.photoURL,
      createdAt: user?.createdAt,
      accountAgeHours: user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 3_600_000) : 0,
      isBanned: user?.isBanned ?? false,
      riskScore: sec.riskScore,
      risk: sec.trusted ? "low" : riskLevel(sec.riskScore, hold),
      trusted: sec.trusted,
      approved: sec.approvedCount,
      rejected: sec.rejectedCount,
      submitted: sec.submittedCount,
    });
  });
  return map;
}
