import { col, db, HttpError, requireSession, respond, rows } from "@/lib/server/http";
import type { Campaign, QuestQuestion, Task, TaskSubmission } from "@/types";

export const runtime = "nodejs";

type QuestionResult = {
  id: string;
  text: string;
  kind: QuestQuestion["kind"];
  counts?: Record<string, number>;
  average?: number;
  texts?: string[];
};

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["advertiser", "admin"]);
    const { id } = await ctx.params;
    const campSnap = await db().collection(col.campaigns).doc(id).get();
    if (!campSnap.exists) throw new HttpError(404, "NOT_FOUND", "Campaign not found");
    const campaign = campSnap.data() as Campaign;
    if (campaign.advertiserId !== uid && profile.role !== "admin") {
      throw new HttpError(403, "FORBIDDEN", "This is not your campaign");
    }
    const taskSnap = await db().collection(col.tasks).doc(`camp_${id}`).get();
    const task = taskSnap.exists ? (taskSnap.data() as Task) : null;
    const questions = task?.spec?.questions ?? [];
    if (questions.length === 0) return { responses: 0, questions: [] as QuestionResult[] };

    const subs = rows<TaskSubmission>(
      await db().collection(col.submissions).where("taskId", "==", `camp_${id}`).limit(500).get(),
    ).filter((s) => s.status === "approved" && s.answers);

    const results: QuestionResult[] = questions.map((q) => {
      const out: QuestionResult = { id: q.id, text: q.text, kind: q.kind };
      const values = subs.map((s) => s.answers?.[q.id]).filter((v) => v !== undefined);
      if (q.kind === "choice" || q.kind === "multi") {
        out.counts = Object.fromEntries((q.options ?? []).map((o) => [o, 0]));
        for (const v of values) {
          for (const pick of Array.isArray(v) ? v : [String(v)]) {
            if (pick in out.counts) out.counts[pick] += 1;
          }
        }
      } else if (q.kind === "rating") {
        const nums = values.map(Number).filter(Number.isFinite);
        out.average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
        out.counts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        for (const n of nums) out.counts[String(n)] += 1;
      } else {
        out.texts = values.map(String).slice(-30).reverse();
      }
      return out;
    });
    return { responses: subs.length, questions: results };
  });
}
