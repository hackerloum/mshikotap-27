import { changeCampaignStatus } from "@/lib/server/campaigns";
import { db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";
import type { CampaignStatus } from "@/types";

export const runtime = "nodejs";

const allowed: CampaignStatus[] = ["active", "paused", "completed", "rejected"];

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["advertiser", "admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ status?: string; reason?: string }>(request);
    if (!allowed.includes(body.status as CampaignStatus)) {
      throw new HttpError(400, "INVALID_INPUT", "Unknown status");
    }
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : undefined;
    return changeCampaignStatus(
      db(),
      id,
      body.status as CampaignStatus,
      { uid, name: profile.displayName, role: profile.role === "admin" ? "admin" : "advertiser" },
      reason,
    );
  });
}
