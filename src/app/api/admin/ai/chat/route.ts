import { HttpError, readJson, requireSession, respond } from "@/lib/server/http";
import { runManager } from "@/lib/server/ai/manager";
import { aiConfigured } from "@/lib/server/ai/tools";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    if (!aiConfigured()) throw new HttpError(503, "AI_OFF", "AI is not connected. Add OPENAI_API_KEY in Vercel.");
    const body = await readJson<{ messages?: { role?: string; content?: string }[] }>(request);
    const messages = (body.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-16)
      .map((m) => ({ role: m.role as "user" | "assistant", content: (m.content as string).slice(0, 4000) }));
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      throw new HttpError(400, "INVALID_INPUT", "Send a message");
    }
    try {
      return await runManager("chat", { messages });
    } catch (e) {
      throw new HttpError(502, "AI_FAILED", e instanceof Error ? e.message.slice(0, 200) : "The AI could not answer");
    }
  });
}
