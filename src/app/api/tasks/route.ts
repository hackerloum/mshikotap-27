import { FieldValue } from "firebase-admin/firestore";
import { col, dayKey, db, httpUrl, HttpError, optStr, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import {
  applyRisk,
  fingerprint,
  normalizeUrl,
  proofKey,
  readSecurity,
  securityRef,
  type FlagInput,
} from "@/lib/server/security";
import { assertAvailable, minSecondsFor, sessionWindowMs } from "@/lib/server/quests";
import { publicSubmission } from "@/lib/server/views";
import { getSettings } from "@/lib/server/settings";
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
    const settings = await getSettings();
    const body = await readJson<{ taskId?: string; proofUrl?: string; notes?: string }>(request);
    const taskId = str(body.taskId, "taskId", 120);
    const proofUrl = httpUrl(body.proofUrl, "Proof link");
    if (proofUrl && !proofUrl.startsWith("https://")) {
      throw new HttpError(400, "INVALID_INPUT", "Proof link must start with https://");
    }
    const notes = optStr(body.notes, 1000);
    const fp = fingerprint(request);

    const firestore = db();
    const taskRef = firestore.collection(col.tasks).doc(taskId);
    const subRef = firestore.collection(col.submissions).doc(`${uid}_${taskId}`);
    const sessionRef = firestore.collection(col.sessions).doc(`${uid}_${taskId}`);
    const userRef = firestore.collection(col.users).doc(uid);
    const limitRef = firestore.collection(col.limits).doc(`${uid}_${dayKey()}`);
    const proofRef = proofUrl ? firestore.collection(col.proofs).doc(proofKey(proofUrl)) : null;

    const outcome = await firestore.runTransaction(async (tx) => {
      const [taskSnap, subSnap, sessionSnap, limitSnap, proofSnap] = await Promise.all([
        tx.get(taskRef),
        tx.get(subRef),
        tx.get(sessionRef),
        tx.get(limitRef),
        proofRef ? tx.get(proofRef) : Promise.resolve(null),
      ]);
      const sec = await readSecurity(tx, firestore, uid);

      if (!taskSnap.exists) throw new HttpError(404, "NOT_FOUND", "Quest not found");
      const task = { ...(taskSnap.data() as Task), id: taskId };
      assertAvailable(task, settings);
      if (subSnap.exists) throw new HttpError(409, "DUPLICATE", "You already sent this quest");
      if (task.requiresScreenshot && !proofUrl) {
        throw new HttpError(400, "PROOF_REQUIRED", "Add a proof link for this quest");
      }
      if (!sessionSnap.exists) {
        throw new HttpError(409, "NOT_STARTED", "Start the quest first, then send your proof");
      }

      const now = new Date();
      const stamp = now.toISOString();
      const startedAt = new Date((sessionSnap.data() as { startedAt: string }).startedAt).getTime();
      const elapsedMs = now.getTime() - startedAt;

      const blocked = (error: HttpError, points = 0, flag?: FlagInput) => {
        if (points || flag) {
          const { banned } = applyRisk(tx, firestore, uid, sec, points, settings, flag);
          if (banned) return { blocked: new HttpError(403, "BANNED", "This account is suspended") };
        }
        return { blocked: error };
      };

      if (elapsedMs > sessionWindowMs(task)) {
        tx.delete(sessionRef);
        return blocked(new HttpError(409, "SESSION_EXPIRED", "Time ran out. Start the quest again."));
      }

      const minSeconds = minSecondsFor(task, settings);
      if (elapsedMs < minSeconds * 1000) {
        const wait = Math.ceil((minSeconds * 1000 - elapsedMs) / 1000);
        return blocked(
          new HttpError(429, "TOO_FAST", `Too fast. Finish the steps first, then try again in ${wait}s.`, { retryInSeconds: wait }),
          5,
          { kind: "too_fast", severity: "low", detail: `Sent proof after ${Math.round(elapsedMs / 1000)}s, needs ${minSeconds}s`, entityId: taskId },
        );
      }

      const limit = limitSnap.exists
        ? (limitSnap.data() as { submissions?: number; reward?: number; lastAt?: string })
        : {};
      if (limit.lastAt && now.getTime() - new Date(limit.lastAt).getTime() < settings.minSecondsBetweenSubmissions * 1000) {
        return blocked(new HttpError(429, "SLOW_DOWN", "Slow down a little between quests."));
      }
      if ((limit.submissions ?? 0) >= settings.maxSubmissionsPerDay) {
        return blocked(
          new HttpError(429, "DAILY_LIMIT", "You hit today's quest limit. Come back tomorrow."),
          2,
          { kind: "rate_limited", severity: "low", detail: `Reached ${settings.maxSubmissionsPerDay} submissions in a day` },
        );
      }
      if ((limit.reward ?? 0) + task.reward > settings.maxDailyQuestReward) {
        return blocked(new HttpError(429, "DAILY_CAP", "You reached today's earning cap. Come back tomorrow."));
      }

      if (proofUrl && task.targetUrl) {
        let sameAsTarget = false;
        try {
          sameAsTarget = normalizeUrl(proofUrl) === normalizeUrl(task.targetUrl);
        } catch {
          sameAsTarget = false;
        }
        if (sameAsTarget) {
          return blocked(
            new HttpError(400, "PROOF_INVALID", "That is the quest link. Send a screenshot or post link as proof."),
            10,
            { kind: "proof_is_target", severity: "low", detail: "Quest link used as proof", entityId: taskId },
          );
        }
      }
      if (proofSnap?.exists) {
        const used = proofSnap.data() as { userId: string; taskId: string };
        return blocked(
          new HttpError(409, "PROOF_REUSED", "This proof was already used. Send your own proof."),
          25,
          {
            kind: "duplicate_proof",
            severity: "high",
            detail: used.userId === uid ? "Reused own proof on another quest" : "Proof already submitted by another account",
            entityId: taskId,
          },
        );
      }

      const submission: Omit<TaskSubmission, "id"> & Record<string, unknown> = {
        taskId,
        taskTitle: task.title,
        reward: task.reward,
        xpReward: task.xpReward,
        userId: uid,
        userName: profile.displayName,
        status: "submitted",
        submittedAt: stamp,
        elapsedSeconds: Math.round(elapsedMs / 1000),
        riskScore: sec.riskScore,
        ...(fp.ipHash ? { ipHash: fp.ipHash } : {}),
        ...(fp.deviceHash ? { deviceHash: fp.deviceHash } : {}),
        ...(proofUrl ? { proofUrl } : {}),
        ...(notes ? { notes } : {}),
      };
      tx.create(subRef, submission);
      tx.update(userRef, { "wallet.pendingBalance": FieldValue.increment(task.reward) });
      if (proofRef) tx.create(proofRef, { userId: uid, taskId, submissionId: subRef.id, createdAt: stamp });
      tx.set(
        limitRef,
        {
          userId: uid,
          day: dayKey(now),
          submissions: FieldValue.increment(1),
          reward: FieldValue.increment(task.reward),
          lastAt: stamp,
        },
        { merge: true },
      );
      tx.delete(sessionRef);
      tx.set(securityRef(firestore, uid), { submittedCount: FieldValue.increment(1), updatedAt: stamp }, { merge: true });

      return { submission: { id: subRef.id, ...submission } };
    });

    if ("blocked" in outcome) throw outcome.blocked;
    return publicSubmission(outcome.submission as TaskSubmission & Record<string, unknown>);
  }, 201);
}
