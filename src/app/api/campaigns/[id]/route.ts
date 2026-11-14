import { auditNow } from "@/lib/server/audit";
import { col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";
import type { Campaign, CampaignStatus } from "@/types";

export const runtime = "nodejs";

const allowed: CampaignStatus[] = ["active", "paused", "completed"];

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["advertiser", "admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ status?: string }>(request);
    if (!allowed.includes(body.status as CampaignStatus)) {
      throw new HttpError(400, "INVALID_INPUT", "Unknown status");
    }
    const status = body.status as CampaignStatus;

    const firestore = db();
    const ref = firestore.collection(col.campaigns).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "NOT_FOUND", "Campaign not found");
    const campaign = { ...(snap.data() as Campaign), id };
    if (campaign.advertiserId !== uid && profile.role !== "admin") {
      throw new HttpError(403, "FORBIDDEN", "Not your campaign");
    }

    const batch = firestore.batch();
    batch.update(ref, { status });
    batch.set(
      firestore.collection(col.tasks).doc(`camp_${id}`),
      { status: status === "active" ? "open" : "expired" },
      { merge: true },
    );
    await batch.commit();
    if (profile.role === "admin") {
      await auditNow(firestore, {
        actorId: uid,
        actorName: profile.displayName,
        action: "campaign.status",
        entityType: "campaign",
        entityId: id,
        summary: `Campaign "${campaign.title}" set to ${status}`,
      });
    }
    return { ...campaign, status };
  });
}
