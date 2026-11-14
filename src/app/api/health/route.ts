import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getFirebaseEnvStatus } from "@/lib/firebase/env";

export async function GET() {
  const env = getFirebaseEnvStatus();

  return NextResponse.json({
    ok: true,
    data: {
      service: siteConfig.name,
      firebaseConfigured: isFirebaseConfigured,
      firebaseAdminConfigured: isFirebaseAdminConfigured(),
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
