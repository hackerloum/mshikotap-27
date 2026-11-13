/**
 * Central Firebase / hosting env contract for Vercel + local.
 * Client keys must be NEXT_PUBLIC_*. Server Admin keys must never be.
 */

export const firebasePublicEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
] as const;

export const firebaseAdminEnvKeys = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

export const appEnvKeys = [
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_DEMO_MODE",
] as const;

export function getFirebaseEnvStatus() {
  const missingPublic = firebasePublicEnvKeys.filter(
    (key) => !process.env[key] && key !== "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" && key !== "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
  );
  const missingAdmin = firebaseAdminEnvKeys.filter((key) => !process.env[key]);

  return {
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    clientReady: missingPublic.length === 0,
    adminReady: missingAdmin.length === 0,
    missingPublic,
    missingAdmin,
  };
}
