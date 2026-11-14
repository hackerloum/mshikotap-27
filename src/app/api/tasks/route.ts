import { FieldValue } from "firebase-admin/firestore";
import { col, db, httpUrl, HttpError, optStr, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import type { Task, TaskSubmission } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.toLowerCase();

    const [taskSnap, mineSnap] = await Promise.all([
      db().collection(col.tasks).where("status", "==", "open").limit(200).get(),
      db().collection(col.submissions).where("userId", "==", uid).get(),
    ]);
    const taken = new Set(rows<TaskSubmission>(mineSnap).map((s) => s.taskId));
    const now = Date.now();

    return rows<Task>(taskSnap)
      .filter((t) => !taken.has(t.id))
      .filter((t) => !t.expiresAt || new Date(t.expiresAt).getTime() > now)
      .filter((t) => !t.maxCompletions || t.completions < t.maxCompletions)
      .filter((t) => !category || category === "all" || t.category === category)
      .filter(
        (t) =>
          !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request);
    const body = await readJson<{ taskId?: string; proofUrl?: string; notes?: string }>(request);
    const taskId = str(body.taskId, "taskId", 120);
    const proofUrl = httpUrl(body.proofUrl, "Proof link");
    const notes = optStr(body.notes, 1000);

    const firestore = db();
    const taskRef = firestore.collection(col.tasks).doc(taskId);
    const subRef = firestore.collection(col.submissions).doc(`${uid}_${taskId}`);
    const userRef = firestore.collection(col.users).doc(uid);

    return firestore.runTransaction(async (tx) => {
      const [taskSnap, subSnap] = await Promise.all([tx.get(taskRef), tx.get(subRef)]);
      if (!taskSnap.exists) throw new HttpError(404, "NOT_FOUND", "Quest not found");
      const task = taskSnap.data() as Task;

      if (task.status !== "open") throw new HttpError(409, "CLOSED", "This quest is closed");
      if (task.maxCompletions && task.completions >= task.maxCompletions) {
        throw new HttpError(409, "FULL", "This quest is full");
      }
      if (task.requiresScreenshot && !proofUrl) {
        throw new HttpError(400, "PROOF_REQUIRED", "Add a proof link for this quest");
      }
      if (subSnap.exists) throw new HttpError(409, "DUPLICATE", "You already sent this quest");

      const submission: Omit<TaskSubmission, "id"> & Record<string, unknown> = {
        taskId,
        taskTitle: task.title,
        reward: task.reward,
        xpReward: task.xpReward,
        userId: uid,
        userName: profile.displayName,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        ...(proofUrl ? { proofUrl } : {}),
        ...(notes ? { notes } : {}),
      };
      tx.create(subRef, submission);
      tx.update(userRef, { "wallet.pendingBalance": FieldValue.increment(task.reward) });
      return { id: subRef.id, ...submission };
    });
  }, 201);
}
