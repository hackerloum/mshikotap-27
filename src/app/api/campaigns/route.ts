import { FieldValue } from "firebase-admin/firestore";
import { amount, col, db, HttpError, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import { ledgerInTx } from "@/lib/server/money";
import { getSettings } from "@/lib/server/settings";
import { advertiserCategories, validateQuest } from "@/config/quests";
import type { Campaign, Task, TaskCategory } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["advertiser", "admin"]);
    const all = new URL(request.url).searchParams.get("scope") === "all" && profile.role === "admin";
    const ref = db().collection(col.campaigns);
    const snap = all ? await ref.limit(300).get() : await ref.where("advertiserId", "==", uid).get();
    return rows<Campaign>(snap).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request, ["advertiser", "admin"]);
    const body = await readJson<Record<string, unknown>>(request);

    if (!advertiserCategories.includes(body.category as TaskCategory)) {
      throw new HttpError(400, "INVALID_INPUT", "Pick what you want players to do");
    }
    const quest = validateQuest(body);
    if (!quest.ok) throw new HttpError(400, "INVALID_INPUT", quest.message);
    const q = quest.value;
    const title = str(body.title, "Title", 120);
    const instructions = q.instructions;
    const budget = amount(body.budgetCredits, "Budget");
    const costPerAction = amount(body.costPerAction, "Cost per action");
    const targetUrl = q.targetUrl;
    const settings = await getSettings();
    if (costPerAction < settings.minCostPerAction) {
      throw new HttpError(400, "INVALID_BUDGET", `Each completion must cost at least TSh ${settings.minCostPerAction.toLocaleString("en-US")}`);
    }
    if (costPerAction > budget) {
      throw new HttpError(400, "INVALID_BUDGET", "Budget must cover at least one completion");
    }
    const slots = Math.floor(budget / costPerAction);
    const reserve = slots * costPerAction;
    const reward = Math.max(1, Math.floor((costPerAction * settings.playerSharePercent) / 100));
    const needsApproval = settings.campaignsNeedApproval;

    const firestore = db();
    const userRef = firestore.collection(col.users).doc(uid);
    const campaignRef = firestore.collection(col.campaigns).doc();
    const taskRef = firestore.collection(col.tasks).doc(`camp_${campaignRef.id}`);

    return firestore.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const credits = (userSnap.data()?.advertiserCredits as number | undefined) ?? 0;
      if (reserve > credits) {
        throw new HttpError(400, "NO_CREDITS", "Not enough credits. Add money first.");
      }

      const now = new Date().toISOString();
      const campaign: Omit<Campaign, "id"> = {
        advertiserId: uid,
        title,
        type: q.category,
        status: needsApproval ? "draft" : "active",
        budgetCredits: reserve,
        spentCredits: 0,
        costPerAction,
        playerReward: reward,
        instructions,
        completions: 0,
        createdAt: now,
        ...(targetUrl ? { targetUrl } : {}),
      };
      const task: Omit<Task, "id"> = {
        title,
        description: instructions.slice(0, 160),
        instructions,
        category: q.category,
        type: q.type,
        spec: q.spec,
        reward,
        xpReward: 10,
        status: needsApproval ? "expired" : "open",
        requiresScreenshot: q.requiresScreenshot,
        ...(q.minSeconds ? { minSeconds: q.minSeconds } : {}),
        maxCompletions: slots,
        completions: 0,
        advertiserId: uid,
        campaignId: campaignRef.id,
        createdAt: now,
        ...(targetUrl ? { targetUrl } : {}),
      };

      tx.create(campaignRef, campaign);
      tx.create(taskRef, task);
      tx.update(userRef, { advertiserCredits: FieldValue.increment(-reserve) });
      ledgerInTx(tx, firestore, {
        uid,
        type: "campaign_fund",
        amount: -reserve,
        ref: campaignRef.id,
        note: `Funded "${title}" for ${slots} completions`,
      });
      return { id: campaignRef.id, ...campaign };
    });
  }, 201);
}
