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
  const text = raw.replace(/\\+n/g, "\n").replace(/\r/g, "");
  const match = text.match(/-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/);
  if (!match) return text;
  const body = match[2].replace(/[^A-Za-z0-9+/=]/g, "");
  const lines = body.match(/.{1,64}/g)?.join("\n") ?? body;
  return `-----BEGIN ${match[1]}-----\n${lines}\n-----END ${match[1]}-----\n`;
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

export function describePrivateKey() {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  const text = raw.replace(/\\+n/g, "\n");
  const match = text.match(/-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/);
  return {
    length: raw.length,
    hasBegin: raw.includes("BEGIN PRIVATE KEY"),
    hasEnd: raw.includes("END PRIVATE KEY"),
    literalBackslashN: (raw.match(/\\n/g) ?? []).length,
    realNewlines: (raw.match(/\n/g) ?? []).length,
    startsWithQuote: /^["']/.test(raw.trim()),
    bodyLength: match ? match[2].replace(/[^A-Za-z0-9+/=]/g, "").length : 0,
    clientEmailSet: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
  };
}
