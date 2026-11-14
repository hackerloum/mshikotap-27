import { amount, col, db, httpUrl, HttpError, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import type { Task, TaskCategory, TaskType } from "@/types";

export const runtime = "nodejs";

const categories: TaskCategory[] = ["social", "youtube", "survey", "video", "app_install", "referral", "daily", "quiz", "typing", "screenshot"];
const types: TaskType[] = ["follow", "like", "comment", "subscribe", "survey", "watch", "install", "referral", "daily_login", "quiz", "typing", "screenshot_proof"];

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const snap = await db().collection(col.tasks).limit(300).get();
    return rows<Task>(snap).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request, ["admin"]);
    const body = await readJson<Record<string, unknown>>(request);
    if (!categories.includes(body.category as TaskCategory)) {
      throw new HttpError(400, "INVALID_INPUT", "Pick a category");
    }
    const maxCompletions = body.maxCompletions ? amount(body.maxCompletions, "Max completions") : undefined;
    const minutes = body.timeLimitMinutes ? amount(body.timeLimitMinutes, "Time limit") : undefined;
    const targetUrl = httpUrl(body.targetUrl, "Target link");

    const task: Omit<Task, "id"> = {
      title: str(body.title, "Title", 120),
      description: str(body.description, "Description", 300),
      instructions: str(body.instructions, "Instructions", 1000),
      category: body.category as TaskCategory,
      type: (types.includes(body.type as TaskType) ? body.type : "screenshot_proof") as TaskType,
      reward: amount(body.reward, "Reward"),
      xpReward: body.xpReward ? amount(body.xpReward, "XP") : 10,
      status: "open",
      requiresScreenshot: body.requiresScreenshot !== false,
      completions: 0,
      advertiserId: uid,
      createdAt: new Date().toISOString(),
      ...(maxCompletions ? { maxCompletions } : {}),
      ...(minutes ? { timeLimitMinutes: minutes } : {}),
      ...(targetUrl ? { targetUrl } : {}),
    };
    const ref = await db().collection(col.tasks).add(task);
    return { id: ref.id, ...task };
  }, 201);
}
