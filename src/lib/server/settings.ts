import "server-only";
import { db, HttpError } from "@/lib/server/http";
import { defaultSettings, numberRules, type SystemSettings } from "@/config/system";

const DOC = { collection: "settings", id: "system" } as const;
const TTL_MS = 15_000;

let cache: { at: number; value: SystemSettings } | null = null;

function merge(stored: Record<string, unknown> | undefined): SystemSettings {
  const out: SystemSettings = { ...defaultSettings };
  if (!stored) return out;
  for (const key of Object.keys(numberRules) as Array<keyof typeof numberRules>) {
    const value = stored[key];
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  for (const key of ["signupsOpen", "questsOpen", "withdrawalsOpen"] as const) {
    if (typeof stored[key] === "boolean") out[key] = stored[key] as boolean;
  }
  if (typeof stored.announcement === "string") out.announcement = stored.announcement;
  return out;
}

export async function getSettings(force = false): Promise<SystemSettings> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    const snap = await db().collection(DOC.collection).doc(DOC.id).get();
    const value = merge(snap.exists ? (snap.data() as Record<string, unknown>) : undefined);
    cache = { at: Date.now(), value };
    return value;
  } catch (error) {
    if (cache) return cache.value;
    if (error instanceof HttpError) throw error;
    return defaultSettings;
  }
}

export function validateSettingsPatch(input: Record<string, unknown>): Partial<SystemSettings> {
  const patch: Partial<SystemSettings> = {};

  for (const key of Object.keys(numberRules) as Array<keyof typeof numberRules>) {
    if (!(key in input)) continue;
    const rule = numberRules[key];
    const raw = input[key];
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
      throw new HttpError(400, "INVALID_INPUT", `${key} must be between ${rule.min} and ${rule.max}`);
    }
    patch[key] = rule.integer ? Math.round(value) : Math.round(value * 100) / 100;
  }
  for (const key of ["signupsOpen", "questsOpen", "withdrawalsOpen"] as const) {
    if (!(key in input)) continue;
    if (typeof input[key] !== "boolean") throw new HttpError(400, "INVALID_INPUT", `${key} must be true or false`);
    patch[key] = input[key] as boolean;
  }
  if ("announcement" in input) {
    patch.announcement = typeof input.announcement === "string" ? input.announcement.trim().slice(0, 240) : "";
  }
  return patch;
}

export async function saveSettings(patch: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSettings(true);
  const next = { ...current, ...patch };
  if (next.autoBanRiskScore <= next.holdRiskScore) {
    throw new HttpError(400, "INVALID_INPUT", "Auto-suspend score must be higher than the cash-out hold score");
  }
  await db()
    .collection(DOC.collection)
    .doc(DOC.id)
    .set({ ...next, updatedAt: new Date().toISOString() });
  cache = { at: Date.now(), value: next };
  return next;
}
