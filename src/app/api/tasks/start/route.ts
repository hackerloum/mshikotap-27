import { col, db, HttpError, readJson, requireSession, respond, str } from "@/lib/server/http";
import { fingerprint } from "@/lib/server/security";
import { assertAvailable, minSecondsFor, sessionWindowMs } from "@/lib/server/quests";
import { getSettings } from "@/lib/server/settings";
import type { Task } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const settings = await getSettings();
    const body = await readJson<{ taskId?: string }>(request);
    const taskId = str(body.taskId, "taskId", 120);
    const fp = fingerprint(request);

    const firestore = db();
    const taskRef = firestore.collection(col.tasks).doc(taskId);
    const subRef = firestore.collection(col.submissions).doc(`${uid}_${taskId}`);
    const sessionRef = firestore.collection(col.sessions).doc(`${uid}_${taskId}`);

    return firestore.runTransaction(async (tx) => {
      const [taskSnap, subSnap, sessionSnap] = await Promise.all([
        tx.get(taskRef),
        tx.get(subRef),
        tx.get(sessionRef),
      ]);
      if (!taskSnap.exists) throw new HttpError(404, "NOT_FOUND", "Quest not found");
      const task = { ...(taskSnap.data() as Task), id: taskId };
      assertAvailable(task, settings);
      if (subSnap.exists) throw new HttpError(409, "DUPLICATE", "You already sent this quest");

      const minSeconds = minSecondsFor(task, settings);
      const existing = sessionSnap.exists ? (sessionSnap.data() as { startedAt: string }) : null;
      const fresh =
        existing && Date.now() - new Date(existing.startedAt).getTime() < sessionWindowMs(task);

      const startedAt = fresh && existing ? existing.startedAt : new Date().toISOString();
      if (!fresh) {
        tx.set(sessionRef, {
          userId: uid,
          taskId,
          startedAt,
          ...(fp.ipHash ? { ipHash: fp.ipHash } : {}),
          ...(fp.deviceHash ? { deviceHash: fp.deviceHash } : {}),
        });
      }
      return {
        taskId,
        startedAt,
        minSeconds,
        readyAt: new Date(new Date(startedAt).getTime() + minSeconds * 1000).toISOString(),
        serverNow: new Date().toISOString(),
        expiresAt: task.timeLimitMinutes
          ? new Date(new Date(startedAt).getTime() + task.timeLimitMinutes * 60_000).toISOString()
          : undefined,
      };
    });
  });
}
