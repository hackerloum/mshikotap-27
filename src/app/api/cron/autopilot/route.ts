import { HttpError, respond } from "@/lib/server/http";
import { runAutopilot } from "@/lib/server/ai/manager";
import { getSettings } from "@/lib/server/settings";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  return respond(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
      throw new HttpError(401, "UNAUTHORIZED", "Not allowed");
    }
    const settings = await getSettings(true);
    if (!settings.aiAutopilot) return { skipped: "Autopilot is off" };
    return runAutopilot("cron");
  });
}
