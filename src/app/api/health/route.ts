import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getFirebaseEnvStatus } from "@/lib/firebase/env";

export const dynamic = "force-dynamic";

async function pingFirestore() {
  try {
    const db = getAdminDb();
    if (!db) return { ok: false, reason: "admin credentials missing" };
    await db.collection("settings").doc("system").get();
    return { ok: true };
  } catch (error) {
    const e = error as { code?: string | number; message?: string };
    return { ok: false, reason: `${e.code ?? "error"}: ${(e.message ?? "").slice(0, 160)}` };
  }
}

export async function GET() {
  const env = getFirebaseEnvStatus();
  const firestore = await pingFirestore();

  return NextResponse.json({
    ok: true,
    data: {
      service: siteConfig.name,
      firebaseConfigured: isFirebaseConfigured,
      firebaseAdminConfigured: isFirebaseAdminConfigured(),
      firestore,
      env: {
        clientReady: env.clientReady,
        adminReady: env.adminReady,
        missingPublic: env.missingPublic,
        missingAdmin: env.missingAdmin,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
