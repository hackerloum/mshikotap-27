import { auditNow } from "@/lib/server/audit";
import { db, readJson, requireSession, respond } from "@/lib/server/http";
import { getSettings, saveSettings, validateSettingsPatch } from "@/lib/server/settings";
import type { SystemSettings } from "@/config/system";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    await requireSession(request, ["admin"]);
    return getSettings(true);
  });
}

export async function PATCH(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["admin"]);
    const body = await readJson<Record<string, unknown>>(request);
    const patch = validateSettingsPatch(body);
    const before = await getSettings(true);
    const next = await saveSettings(patch);

    const changed = (Object.keys(patch) as Array<keyof SystemSettings>)
      .filter((key) => before[key] !== next[key])
      .map((key) => `${key}: ${String(before[key])} -> ${String(next[key])}`);
    if (changed.length > 0) {
      await auditNow(db(), {
        actorId: uid,
        actorName: profile.displayName,
        action: "settings.update",
        entityType: "settings",
        summary: changed.join("; "),
      });
    }
    return next;
  });
}
