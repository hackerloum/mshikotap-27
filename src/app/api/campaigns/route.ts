import { FieldValue } from "firebase-admin/firestore";
import { amount, col, db, httpUrl, HttpError, readJson, requireSession, respond, rows, str } from "@/lib/server/http";
import type { Campaign, CampaignType, Task, TaskCategory, TaskType } from "@/types";

export const runtime = "nodejs";

const PLAYER_SHARE = 0.7;

const mapping: Record<CampaignType, { category: TaskCategory; type: TaskType }> = {
  instagram_follow: { category: "social", type: "follow" },
  tiktok_follow: { category: "social", type: "follow" },
  youtube_subscribe: { category: "youtube", type: "subscribe" },
  website_visit: { category: "screenshot", type: "screenshot_proof" },
  app_install: { category: "app_install", type: "install" },
  survey: { category: "survey", type: "survey" },
  comment_engagement: { category: "social", type: "comment" },
};

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

    const type = body.type as CampaignType;
    if (!mapping[type]) throw new HttpError(400, "INVALID_INPUT", "Pick a campaign type");
    const title = str(body.title, "Title", 120);
    const instructions = str(body.instructions, "Instructions", 1000);
    const budget = amount(body.budgetCredits, "Budget");
    const costPerAction = amount(body.costPerAction, "Cost per action");
    const targetUrl = httpUrl(body.targetUrl, "Target link");
    if (costPerAction > budget) {
      throw new HttpError(400, "INVALID_BUDGET", "Budget must cover at least one action");
    }

    const firestore = db();
    const userRef = firestore.collection(col.users).doc(uid);
    const campaignRef = firestore.collection(col.campaigns).doc();
    const taskRef = firestore.collection(col.tasks).doc(`camp_${campaignRef.id}`);

    return firestore.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const credits = (userSnap.data()?.advertiserCredits as number | undefined) ?? 0;
      if (budget > credits) {
        throw new HttpError(400, "NO_CREDITS", "Not enough credits. Top up first.");
      }

      const now = new Date().toISOString();
      const campaign: Omit<Campaign, "id"> = {
        advertiserId: uid,
        title,
        type,
        status: "active",
        budgetCredits: budget,
        spentCredits: 0,
        costPerAction,
        instructions,
        completions: 0,
        createdAt: now,
        ...(targetUrl ? { targetUrl } : {}),
      };
      const task: Omit<Task, "id"> = {
        title,
        description: instructions.slice(0, 160),
        instructions,
        ...mapping[type],
        reward: Math.max(1, Math.floor(costPerAction * PLAYER_SHARE)),
        xpReward: 10,
        status: "open",
        requiresScreenshot: type !== "survey",
        maxCompletions: Math.max(1, Math.floor(budget / costPerAction)),
        completions: 0,
        advertiserId: uid,
        campaignId: campaignRef.id,
        createdAt: now,
        ...(targetUrl ? { targetUrl } : {}),
      };

      tx.create(campaignRef, campaign);
      tx.create(taskRef, task);
      tx.update(userRef, { advertiserCredits: FieldValue.increment(-budget) });
      return { id: campaignRef.id, ...campaign };
    });
  }, 201);
}
