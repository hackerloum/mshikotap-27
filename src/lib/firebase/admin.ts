import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function readPrivateKey() {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
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
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: readPrivateKey()!,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
