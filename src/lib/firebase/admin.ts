import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function clean(value: string | undefined) {
  if (!value) return undefined;
  let out = value.trim();
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1).trim();
  }
  return out || undefined;
}

function readPrivateKey() {
  const raw = clean(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}

let app: App | undefined;

export function getAdminApp() {
  if (!isFirebaseAdminConfigured()) return null;
  if (app) return app;

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  app = initializeApp({
    credential: cert({
      projectId: clean(process.env.FIREBASE_ADMIN_PROJECT_ID)!,
      clientEmail: clean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL)!,
      privateKey: readPrivateKey()!,
    }),
    projectId: clean(process.env.FIREBASE_ADMIN_PROJECT_ID),
    storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  });

  return app;
}

export function getAdminAuth() {
  const adminApp = getAdminApp();
  return adminApp ? getAuth(adminApp) : null;
}

export function getAdminDb() {
  const adminApp = getAdminApp();
  return adminApp ? getFirestore(adminApp) : null;
}

export function getAdminStorage() {
  const adminApp = getAdminApp();
  return adminApp ? getStorage(adminApp) : null;
}
