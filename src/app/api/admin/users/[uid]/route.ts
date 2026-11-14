import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { riskLevel } from "@/config/system";
import { auditInTx } from "@/lib/server/audit";
import { notify } from "@/lib/server/ledger";
import { col, db, HttpError, optStr, readJson, requireSession, respond, rows } from "@/lib/server/http";
import { loadSecurity, readSecurity, securityRef, type FraudFlag } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";
import { publicSubmission } from "@/lib/server/views";
import type { TaskSubmission, UserProfile, Withdrawal } from "@/types";

export const runtime = "nodejs";

async function accountsSharing(
  firestore: Firestore,
  field: "deviceHashes" | "ipHashes",
  hashes: string[],
  selfId: string,
) {
  if (hashes.length === 0) return [];
  const found = new Map<string, number>();
  const snaps = await Promise.all(
    hashes.slice(0, 5).map((h) => firestore.collection(col.security).where(field, "array-contains", h).limit(10).get()),
  );
  snaps.forEach((snap) => snap.docs.forEach((d) => d.id !== selfId && found.set(d.id, (found.get(d.id) ?? 0) + 1)));
  const ids = [...found.keys()].slice(0, 10);
  if (ids.length === 0) return [];
  const users = await firestore.getAll(...ids.map((id) => firestore.collection(col.users).doc(id)));
  return users.map((u) => ({
    uid: u.id,
    name: u.exists ? (u.data() as UserProfile).displayName : "Deleted player",
    email: u.exists ? (u.data() as UserProfile).email : "",
    isBanned: u.exists ? (u.data() as UserProfile).isBanned : false,
  }));
}

export async function GET(request: Request, ctx: { params: Promise<{ uid: string }> }) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const { uid } = await ctx.params;
    const settings = await getSettings();
    const firestore = db();

    const snap = await firestore.collection(col.users).doc(uid).get();
    if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Player not found");
    const profile = { ...(snap.data() as UserProfile), uid };
    const sec = await loadSecurity(firestore, uid);

    const [flags, subs, wds, audit, sameDevice, sameIp, referred] = await Promise.all([
      firestore.collection(col.flags).where("userId", "==", uid).get(),
      firestore.collection(col.submissions).where("userId", "==", uid).get(),
      firestore.collection(col.withdrawals).where("userId", "==", uid).get(),
      firestore.collection(col.audit).where("entityId", "==", uid).limit(40).get(),
      accountsSharing(firestore, "deviceHashes", sec.deviceHashes, uid),
      accountsSharing(firestore, "ipHashes", sec.ipHashes, uid),
      firestore.collection(col.users).where("referredBy", "==", profile.referralCode).count().get(),
    ]);

    const byNewest = <T extends { createdAt?: string; submittedAt?: string }>(a: T, b: T) =>
      (b.createdAt ?? b.submittedAt ?? "").localeCompare(a.createdAt ?? a.submittedAt ?? "");

    return {
      profile,
      security: {
        riskScore: sec.riskScore,
        risk: sec.trusted ? "low" : riskLevel(sec.riskScore, settings.holdRiskScore),
        trusted: sec.trusted,
        submitted: sec.submittedCount,
        approved: sec.approvedCount,
        rejected: sec.rejectedCount,
        referralPaid: sec.referralPaidCount,
        devices: sec.deviceHashes.length,
        ips: sec.ipHashes.length,
      },
      referrals: referred.data().count,
      sameDevice,
      sameIp,
      flags: rows<FraudFlag>(flags).sort(byNewest).slice(0, 40),
      submissions: rows<TaskSubmission & Record<string, unknown>>(subs).map(publicSubmission).sort(byNewest).slice(0, 30),
      withdrawals: rows<Withdrawal>(wds).sort(byNewest).slice(0, 20),
      audit: rows<Record<string, unknown> & { createdAt?: string }>(audit).sort(byNewest),
    };
  });
}

type Patch = {
  isBanned?: boolean;
  banReason?: string;
  role?: string;
  grantCredits?: number;
  adjustBalance?: { amount?: number; reason?: string };
  trusted?: boolean;
  resetRisk?: boolean;
  message?: { title?: string; body?: string };
};

export async function PATCH(request: Request, ctx: { params: Promise<{ uid: string }> }) {
  return respond(async () => {
    const { uid: adminId, profile: admin } = await requireSession(request, ["admin"]);
    const { uid } = await ctx.params;
    const body = await readJson<Patch>(request);
    const settings = await getSettings();
    const firestore = db();
    const ref = firestore.collection(col.users).doc(uid);

    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Player not found");
      const user = snap.data() as UserProfile;
      if (user.role === "admin" && uid !== adminId) {
        throw new HttpError(403, "FORBIDDEN", "Admins are managed through ADMIN_EMAILS");
      }
      const sec = await readSecurity(tx, firestore, uid);

      const now = new Date().toISOString();
      const update: Record<string, unknown> = { updatedAt: now };
      const secUpdate: Record<string, unknown> = {};
      const log = (action: string, summary: string) =>
        auditInTx(tx, firestore, {
          actorId: adminId,
          actorName: admin.displayName,
          action,
          entityType: "user",
          entityId: uid,
          summary: `${summary} (${user.displayName})`,
        });

      if (typeof body.isBanned === "boolean") {
        if (uid === adminId) throw new HttpError(400, "INVALID_INPUT", "You cannot ban yourself");
        if (body.isBanned) {
          const reason = optStr(body.banReason, 200);
          if (!reason) throw new HttpError(400, "INVALID_INPUT", "Add a reason for the suspension");
          update.isBanned = true;
          update.banReason = reason;
          log("user.ban", `Suspended: ${reason}`);
        } else {
          update.isBanned = false;
          update.banReason = FieldValue.delete();
          secUpdate.riskScore = Math.min(sec.riskScore, settings.holdRiskScore - 1);
          log("user.unban", "Reinstated account");
          notify(tx, firestore, uid, "Account reinstated", "Your account is active again. Play fair and keep earning.", "/user");
        }
      }
      if (body.role === "user" || body.role === "advertiser") {
        update.role = body.role;
        log("user.role", `Role set to ${body.role}`);
      }
      if (typeof body.grantCredits === "number" && Number.isFinite(body.grantCredits) && body.grantCredits !== 0) {
        const credits = Math.round(body.grantCredits);
        update.advertiserCredits = FieldValue.increment(credits);
        log("user.credits", `Advertiser credits ${credits > 0 ? "+" : ""}${credits}`);
      }
      if (body.adjustBalance) {
        const value = Math.round(Number(body.adjustBalance.amount));
        const reason = optStr(body.adjustBalance.reason, 200);
        if (!Number.isFinite(value) || value === 0) throw new HttpError(400, "INVALID_INPUT", "Enter an amount");
        if (!reason) throw new HttpError(400, "INVALID_INPUT", "Add a reason for the balance change");
        if (user.wallet.balance + value < 0) throw new HttpError(400, "INSUFFICIENT_FUNDS", "That would make the balance negative");
        update["wallet.balance"] = FieldValue.increment(value);
        update["wallet.updatedAt"] = now;
        log("user.balance", `Balance ${value > 0 ? "+" : ""}${value}: ${reason}`);
        notify(
          tx,
          firestore,
          uid,
          value > 0 ? "Balance added" : "Balance adjusted",
          `${value > 0 ? "+" : "-"}TSh ${Math.abs(value).toLocaleString("en-US")}. ${reason}`,
          "/user/withdraw",
        );
      }
      if (typeof body.trusted === "boolean") {
        secUpdate.trusted = body.trusted;
        log("user.trusted", body.trusted ? "Marked as trusted" : "Removed trusted status");
      }
      if (body.resetRisk) {
        secUpdate.riskScore = 0;
        log("user.reset_risk", "Reset risk score to 0");
      }
      if (body.message) {
        const title = optStr(body.message.title, 80);
        const text = optStr(body.message.body, 400);
        if (!title || !text) throw new HttpError(400, "INVALID_INPUT", "Add a title and a message");
        notify(tx, firestore, uid, title, text);
        log("user.message", `Sent message "${title}"`);
      }

      tx.update(ref, update);
      if (Object.keys(secUpdate).length > 0) {
        tx.set(securityRef(firestore, uid), { ...secUpdate, updatedAt: now }, { merge: true });
      }
      return { uid };
    });
  });
}
