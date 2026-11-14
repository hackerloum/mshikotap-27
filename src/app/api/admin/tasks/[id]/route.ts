import { col, db, HttpError, readJson, requireSession, respond } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const { id } = await ctx.params;
    const body = await readJson<{ status?: string }>(request);
    if (body.status !== "open" && body.status !== "expired") {
      throw new HttpError(400, "INVALID_INPUT", "Status must be open or expired");
    }
    const ref = db().collection(col.tasks).doc(id);
    if (!(await ref.get()).exists) throw new HttpError(404, "NOT_FOUND", "Quest not found");
    await ref.update({ status: body.status });
    return { id, status: body.status };
  });
}
