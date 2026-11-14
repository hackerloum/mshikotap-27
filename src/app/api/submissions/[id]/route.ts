import { HttpError, optStr, readJson, requireSession, respond } from "@/lib/server/http";
import { reviewSubmission } from "@/lib/server/review";

export const runtime = "nodejs";

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
    return reviewSubmission({ id, decision, reason, fraud, reviewerId, reviewerName: reviewer.displayName });
  });
}
