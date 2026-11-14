import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { runAutopilot } from "@/lib/server/ai/manager";
import { aiConfigured } from "@/lib/server/ai/tools";
import { getSettings } from "@/lib/server/settings";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    const settings = await getSettings();
    const snap = await db().collection(col.aiRuns).orderBy("startedAt", "desc").limit(10).get();
    return { configured: aiConfigured(), enabled: settings.aiAutopilot, runs: rows(snap) };
  });
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid } = await requireSession(request, ["admin"]);
    return runAutopilot("manual", uid);
  });
}
