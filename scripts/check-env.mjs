#!/usr/bin/env node
/**
 * Reports which Firebase/Vercel env keys are present — never prints values.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const requiredPublic = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const requiredAdmin = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
];

const optional = [
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
];

function status(key) {
  return process.env[key] && process.env[key].length > 0 ? "set" : "MISSING";
}

console.log("MshikoTap env check (values hidden)\n");
console.log("Client (Firebase Web SDK):");
for (const key of requiredPublic) console.log(`  ${status(key).padEnd(7)} ${key}`);
console.log("\nAdmin (server only):");
for (const key of requiredAdmin) console.log(`  ${status(key).padEnd(7)} ${key}`);
console.log("\nOptional / app:");
for (const key of optional) console.log(`  ${status(key).padEnd(7)} ${key}`);

const missing = [...requiredPublic, ...requiredAdmin].filter(
  (key) => !process.env[key],
);
process.exit(missing.length ? 1 : 0);
