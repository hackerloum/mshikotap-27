import "server-only";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { auditInTx } from "@/lib/server/audit";
import { col, HttpError } from "@/lib/server/http";
import { notify } from "@/lib/server/ledger";
import { ledgerInTx } from "@/lib/server/money";
import type { Campaign, CampaignStatus } from "@/types";

export type Actor = { uid: string; name: string; role: "admin" | "advertiser" | "ai" };

const CLOSING: CampaignStatus[] = ["completed", "rejected"];

export async function changeCampaignStatus(
  firestore: Firestore,
  id: string,
  next: CampaignStatus,
  actor: Actor,
  reason?: string,
) {
  const campaignRef = firestore.collection(col.campaigns).doc(id);
  const taskRef = firestore.collection(col.tasks).doc(`camp_${id}`);

  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(campaignRef);
    if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Campaign not found");
    const campaign = { ...(snap.data() as Campaign), id };
    const isOwner = campaign.advertiserId === actor.uid;
    const staff = actor.role === "admin" || actor.role === "ai";

    if (!staff && !isOwner) throw new HttpError(403, "FORBIDDEN", "Not your campaign");
    if (CLOSING.includes(campaign.status)) {
      throw new HttpError(409, "CLOSED", "This campaign is already closed");
    }
    if (next === "rejected" && !staff) throw new HttpError(403, "FORBIDDEN", "Only staff can reject a campaign");
    if (next === "draft") throw new HttpError(400, "INVALID_INPUT", "Cannot move a campaign back to review");
    if (campaign.status === "draft" && next === "active" && !staff) {
      throw new HttpError(403, "FORBIDDEN", "This campaign is waiting for approval");
    }
    if (campaign.status === "draft" && next === "paused") {
      throw new HttpError(409, "INVALID_STATE", "This campaign is waiting for approval");
    }
    if (campaign.status === next) return campaign;

    let refund = 0;
    if (CLOSING.includes(next)) {
      const pending = await tx.get(
        firestore.collection(col.submissions).where("taskId", "==", `camp_${id}`).where("status", "==", "submitted"),
      );
      const held = pending.size * campaign.costPerAction;
      refund = Math.max(0, campaign.budgetCredits - campaign.spentCredits - held);
    }

    const stamp = new Date().toISOString();
    tx.update(campaignRef, {
      status: next,
      updatedAt: stamp,
      ...(refund > 0 ? { refundedCredits: FieldValue.increment(refund) } : {}),
      ...(reason ? { statusReason: reason.slice(0, 300) } : {}),
    });
    tx.set(taskRef, { status: next === "active" ? "open" : "expired" }, { merge: true });

    if (refund > 0) {
      tx.update(firestore.collection(col.users).doc(campaign.advertiserId), {
        advertiserCredits: FieldValue.increment(refund),
      });
      ledgerInTx(tx, firestore, {
        uid: campaign.advertiserId,
        type: "campaign_refund",
        amount: refund,
        ref: id,
        note: `Refund from "${campaign.title}"`,
      });
    }

    if (staff) {
      auditInTx(tx, firestore, {
        actorId: actor.uid,
        actorName: actor.role === "ai" ? `AI · ${actor.name}` : actor.name,
        action: "campaign.status",
        entityType: "campaign",
        entityId: id,
        summary: `Campaign "${campaign.title}" set to ${next}${reason ? `: ${reason}` : ""}${refund ? ` (refunded TSh ${refund})` : ""}`,
      });
      if (!isOwner) {
        const message =
          next === "active" && campaign.status === "draft"
            ? `"${campaign.title}" was approved and is now live.`
            : next === "rejected"
              ? `"${campaign.title}" was not approved${reason ? `: ${reason}` : ""}. Your money was returned.`
              : `"${campaign.title}" is now ${next}.`;
        notify(tx, firestore, campaign.advertiserId, "Campaign update", message, "/advertiser/campaigns");
      }
    }
    return { ...campaign, status: next };
  });
}
