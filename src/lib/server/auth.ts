import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function verifyRequest(
  request: Request,
): Promise<DecodedIdToken | null> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const auth = getAdminAuth();
  if (!auth) return null;

  try {
    return await auth.verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
