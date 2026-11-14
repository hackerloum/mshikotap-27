import { auditNow } from "@/lib/server/audit";
import { validateQuest } from "@/config/quests";
import { amount, col, db, HttpError, optStr, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import type { Task } from "@/types";

export const runtime = "nodejs";


export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const snap = await db().collection(col.tasks).limit(300).get();
    return rows<Task>(snap).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["admin"]);
    const body = await readJson<Record<string, unknown>>(request);
    const quest = validateQuest(body);
    if (!quest.ok) throw new HttpError(400, "INVALID_INPUT", quest.message);
    const q = quest.value;
    const maxCompletions = body.maxCompletions ? amount(body.maxCompletions, "Max completions") : undefined;
    const minutes = body.timeLimitMinutes ? amount(body.timeLimitMinutes, "Time limit") : undefined;
    const minSeconds =
      body.minSeconds !== undefined && body.minSeconds !== "" && Number(body.minSeconds) >= 0
        ? Math.min(3600, Math.round(Number(body.minSeconds)))
        : q.minSeconds;
    const expiresInHours = body.expiresInHours ? amount(body.expiresInHours, "Expires in") : undefined;
    const title = str(body.title, "Title", 120);

    const task: Omit<Task, "id"> = {
      title,
      description: optStr(body.description, 300) ?? q.instructions.split("\n")[0].slice(0, 160),
      instructions: q.instructions,
      category: q.category,
      type: q.type,
      spec: q.spec,
      reward: amount(body.reward, "Reward"),
      xpReward: body.xpReward ? amount(body.xpReward, "XP") : 10,
      status: "open",
      requiresScreenshot: q.requiresScreenshot,
      completions: 0,
      advertiserId: uid,
      createdBy: "admin",
      createdAt: new Date().toISOString(),
      ...(maxCompletions ? { maxCompletions } : {}),
      ...(minutes ? { timeLimitMinutes: minutes } : {}),
      ...(q.targetUrl ? { targetUrl: q.targetUrl } : {}),
      ...(minSeconds !== undefined ? { minSeconds } : {}),
      ...(expiresInHours
        ? { expiresAt: new Date(Date.now() + expiresInHours * 3_600_000).toISOString() }
        : {}),
    };
    const ref = await db().collection(col.tasks).add(task);
    await auditNow(db(), {
      actorId: uid,
      actorName: profile.displayName,
      action: "task.create",
      entityType: "task",
      entityId: ref.id,
      summary: `Published quest "${task.title}" for TSh ${task.reward}`,
    });
    return { id: ref.id, ...task };
  }, 201);
}
