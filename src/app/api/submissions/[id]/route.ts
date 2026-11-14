import { FieldValue } from "firebase-admin/firestore";
import { bumpEarnings, notify } from "@/lib/server/ledger";
import { col, db, HttpError, optStr, readJson, requireSession, respond } from "@/lib/server/http";
import { levelFromXp } from "@/lib/utils";
import { REFERRAL_BONUS } from "@/config/site";
import type { Campaign, Task, TaskSubmission, UserProfile } from "@/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid: reviewerId } = await requireSession(request, ["admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ decision?: string; reason?: string }>(request);
    if (body.decision !== "approved" && body.decision !== "rejected") {
      throw new HttpError(400, "INVALID_INPUT", "decision must be approved or rejected");
    }
    const decision = body.decision;
    const reason = optStr(body.reason, 300);

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

      const referee = userSnap.exists ? (userSnap.data() as UserProfile) : null;
      const referrerSnap =
        decision === "approved" && referee?.referredBy && referee.wallet.lifetimeEarnings === 0
          ? await tx.get(
              firestore.collection(col.users).where("referralCode", "==", referee.referredBy).limit(1),
            )
          : null;
      const referrerDoc = referrerSnap && !referrerSnap.empty && referrerSnap.docs[0].id !== sub.userId ? referrerSnap.docs[0] : null;

      const reward = sub.reward ?? 0;
      const xpReward = sub.xpReward ?? 0;
      const now = new Date();
      const stamp = now.toISOString();

      tx.update(subRef, {
        status: decision,
        reviewedBy: reviewerId,
        reviewedAt: stamp,
        ...(decision === "rejected" && reason ? { rejectionReason: reason } : {}),
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
          notify(tx, firestore, sub.userId, "Quest approved", `You earned ${reward} TZS and ${xpReward} XP.`, "/user/withdraw");
        } else {
          tx.update(userRef, {
            "wallet.pendingBalance": pending,
            "wallet.updatedAt": stamp,
          });
          notify(tx, firestore, sub.userId, "Quest not approved", reason || "Your proof did not pass review.", "/user/tasks");
        }
      }

      if (referrerDoc) {
        tx.update(referrerDoc.ref, {
          "wallet.balance": FieldValue.increment(REFERRAL_BONUS),
          "wallet.lifetimeEarnings": FieldValue.increment(REFERRAL_BONUS),
          "wallet.updatedAt": stamp,
          referralEarnings: FieldValue.increment(REFERRAL_BONUS),
        });
        bumpEarnings(tx, firestore, referrerDoc.id, REFERRAL_BONUS, now);
        notify(tx, firestore, referrerDoc.id, "Squad bonus", `A friend finished their first quest. You earned ${REFERRAL_BONUS} TZS.`, "/user/referrals");
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

      return { id, status: decision };
    });
  });
}
