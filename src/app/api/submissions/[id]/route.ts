import { FieldValue } from "firebase-admin/firestore";
import { auditInTx } from "@/lib/server/audit";
import { bumpEarnings, notify } from "@/lib/server/ledger";
import { col, db, HttpError, optStr, readJson, requireSession, respond } from "@/lib/server/http";
import { applyRisk, readSecurity, securityRef, toSecurity } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";
import { levelFromXp } from "@/lib/utils";
import type { Campaign, Task, TaskSubmission, UserProfile } from "@/types";

export const runtime = "nodejs";

const REJECT_POINTS = 5;
const FRAUD_POINTS = 30;
const APPROVE_RELIEF = -2;

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid: reviewerId, profile: reviewer } = await requireSession(request, ["admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ decision?: string; reason?: string; fraud?: boolean }>(request);
    if (body.decision !== "approved" && body.decision !== "rejected") {
      throw new HttpError(400, "INVALID_INPUT", "decision must be approved or rejected");
    }
    const decision = body.decision;
    const reason = optStr(body.reason, 300);
    const fraud = decision === "rejected" && body.fraud === true;
    if (decision === "rejected" && !reason) {
      throw new HttpError(400, "INVALID_INPUT", "Add a reason so the player knows what to fix");
    }

    const settings = await getSettings();
    const firestore = db();
    const subRef = firestore.collection(col.submissions).doc(id);

    return firestore.runTransaction(async (tx) => {
      const subSnap = await tx.get(subRef);
      if (!subSnap.exists) throw new HttpError(404, "NOT_FOUND", "Submission not found");
      const sub = { ...(subSnap.data() as TaskSubmission), id };
      if (sub.status !== "submitted") {
        throw new HttpError(409, "ALREADY_REVIEWED", "This submission was already reviewed");
      }

      const userRef = firestore.collection(col.users).doc(sub.userId);
      const taskRef = firestore.collection(col.tasks).doc(sub.taskId);
      const [userSnap, taskSnap] = await Promise.all([tx.get(userRef), tx.get(taskRef)]);
      const task = taskSnap.exists ? (taskSnap.data() as Task) : null;
      const campaignRef = task?.campaignId
        ? firestore.collection(col.campaigns).doc(task.campaignId)
        : null;
      const campaignSnap = campaignRef ? await tx.get(campaignRef) : null;
      const sec = await readSecurity(tx, firestore, sub.userId);

      const referee = userSnap.exists ? (userSnap.data() as UserProfile) : null;
      const referrerSnap =
        decision === "approved" && referee?.referredBy && sec.approvedCount === 0
          ? await tx.get(
              firestore.collection(col.users).where("referralCode", "==", referee.referredBy).limit(1),
            )
          : null;
      const referrerDoc =
        referrerSnap && !referrerSnap.empty && referrerSnap.docs[0].id !== sub.userId
          ? referrerSnap.docs[0]
          : null;
      const referrerSecSnap = referrerDoc ? await tx.get(securityRef(firestore, referrerDoc.id)) : null;
      const referrerSec = toSecurity(
        referrerSecSnap?.exists ? (referrerSecSnap.data() as Record<string, unknown>) : undefined,
      );

      const reward = sub.reward ?? 0;
      const xpReward = sub.xpReward ?? 0;
      const now = new Date();
      const stamp = now.toISOString();

      tx.update(subRef, {
        status: decision,
        reviewedBy: reviewerId,
        reviewedAt: stamp,
        ...(decision === "rejected" && reason ? { rejectionReason: reason } : {}),
        ...(fraud ? { fraud: true } : {}),
      });

      if (userSnap.exists) {
        const user = userSnap.data() as UserProfile;
        const pending = Math.max(0, user.wallet.pendingBalance - reward);

        if (decision === "approved") {
          const xp = user.gamification.xp + xpReward;
          tx.update(userRef, {
            wallet: {
              ...user.wallet,
              pendingBalance: pending,
              balance: user.wallet.balance + reward,
              lifetimeEarnings: user.wallet.lifetimeEarnings + reward,
              updatedAt: stamp,
            },
            "gamification.xp": xp,
            "gamification.level": levelFromXp(xp),
            updatedAt: stamp,
          });
          bumpEarnings(tx, firestore, sub.userId, reward, now);
          tx.set(
            securityRef(firestore, sub.userId),
            { approvedCount: FieldValue.increment(1), updatedAt: stamp },
            { merge: true },
          );
          sec.approvedCount += 1;
          applyRisk(tx, firestore, sub.userId, sec, APPROVE_RELIEF, settings, undefined, user.isBanned);
          notify(
            tx,
            firestore,
            sub.userId,
            "Quest approved",
            `You earned TSh ${reward.toLocaleString("en-US")} and ${xpReward} XP.`,
            "/user/withdraw",
          );
        } else {
          tx.update(userRef, {
            "wallet.pendingBalance": pending,
            "wallet.updatedAt": stamp,
          });
          tx.set(
            securityRef(firestore, sub.userId),
            { rejectedCount: FieldValue.increment(1), updatedAt: stamp },
            { merge: true },
          );
          applyRisk(
            tx,
            firestore,
            sub.userId,
            sec,
            fraud ? FRAUD_POINTS : REJECT_POINTS,
            settings,
            fraud
              ? { kind: "admin_fraud_reject", severity: "high", detail: reason ?? "Marked as fraud", entityId: id }
              : undefined,
            user.isBanned,
          );
          notify(tx, firestore, sub.userId, "Quest not approved", reason ?? "Your proof did not pass review.", "/user/tasks");
        }
      }

      if (referrerDoc) {
        const referrer = referrerDoc.data() as UserProfile;
        const sharedDevice = sec.deviceHashes.some((d) => referrerSec.deviceHashes.includes(d));
        const underCap = referrerSec.referralPaidCount < settings.maxReferralBonuses;

        if (sharedDevice) {
          applyRisk(
            tx,
            firestore,
            sub.userId,
            sec,
            15,
            settings,
            {
              kind: "referral_same_device",
              severity: "high",
              detail: `Referred by ${referrer.displayName} on the same device`,
              entityId: referrerDoc.id,
            },
            referee?.isBanned,
          );
        } else if (!referrer.isBanned && underCap && settings.referralBonus > 0) {
          tx.update(referrerDoc.ref, {
            "wallet.balance": FieldValue.increment(settings.referralBonus),
            "wallet.lifetimeEarnings": FieldValue.increment(settings.referralBonus),
            "wallet.updatedAt": stamp,
            referralEarnings: FieldValue.increment(settings.referralBonus),
          });
          tx.set(
            securityRef(firestore, referrerDoc.id),
            { referralPaidCount: FieldValue.increment(1) },
            { merge: true },
          );
          bumpEarnings(tx, firestore, referrerDoc.id, settings.referralBonus, now);
          notify(
            tx,
            firestore,
            referrerDoc.id,
            "Squad bonus",
            `A friend finished their first quest. You earned TSh ${settings.referralBonus.toLocaleString("en-US")}.`,
            "/user/referrals",
          );
        }
      }

      if (decision === "approved") {
        if (taskSnap.exists) tx.update(taskRef, { completions: FieldValue.increment(1) });
        if (campaignRef && campaignSnap?.exists) {
          const campaign = campaignSnap.data() as Campaign;
          tx.update(campaignRef, {
            completions: FieldValue.increment(1),
            spentCredits: FieldValue.increment(campaign.costPerAction),
          });
        }
      }

      auditInTx(tx, firestore, {
        actorId: reviewerId,
        actorName: reviewer.displayName,
        action: decision === "approved" ? "submission.approve" : fraud ? "submission.reject_fraud" : "submission.reject",
        entityType: "submission",
        entityId: id,
        summary: `${decision === "approved" ? "Approved" : "Rejected"} "${sub.taskTitle ?? sub.taskId}" by ${sub.userName ?? sub.userId}${reason ? `: ${reason}` : ""}`,
      });

      return { id, status: decision };
    });
  });
}
