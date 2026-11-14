import "server-only";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { col } from "@/lib/server/http";

export type AuditEntry = {
  actorId: string;
  actorName: string;
  action: string;
  entityType: "submission" | "withdrawal" | "user" | "task" | "campaign" | "settings" | "fraud" | "challenge";
  entityId?: string;
  summary: string;
};

function payload(entry: AuditEntry) {
  return {
    ...entry,
    summary: entry.summary.slice(0, 300),
    createdAt: new Date().toISOString(),
  };
}

export function auditInTx(tx: Transaction, db: Firestore, entry: AuditEntry) {
  tx.create(db.collection(col.audit).doc(), payload(entry));
}

export async function auditNow(db: Firestore, entry: AuditEntry) {
  await db.collection(col.audit).add(payload(entry));
}
