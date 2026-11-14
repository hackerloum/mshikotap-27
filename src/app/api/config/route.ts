import { NextResponse } from "next/server";
import { defaultSettings, toPublicConfig } from "@/config/system";
import { getSettings } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ ok: true, data: toPublicConfig(settings) });
  } catch {
    return NextResponse.json({ ok: true, data: toPublicConfig(defaultSettings) });
  }
}
