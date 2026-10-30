import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      service: siteConfig.name,
      demoMode: siteConfig.demoMode,
      firebaseConfigured: isFirebaseConfigured,
      timestamp: new Date().toISOString(),
    },
  });
}
