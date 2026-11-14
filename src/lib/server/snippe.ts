import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/server/http";

const DEFAULT_BASE = "https://api.snippe.sh";
const SESSION_PATHS = ["/api/v1/sessions", "/v1/sessions"];
const REPLAY_WINDOW_SECONDS = 300;

function clean(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
}

function baseUrl() {
  return (clean(process.env.SNIPPE_BASE_URL) ?? DEFAULT_BASE).replace(/\/+$/, "");
}

export function snippeConfigured() {
  return Boolean(clean(process.env.SNIPPE_API_KEY));
}

export function snippeWebhookConfigured() {
  return Boolean(clean(process.env.SNIPPE_WEBHOOK_SECRET));
}

export function appUrl() {
  const raw = clean(process.env.NEXT_PUBLIC_APP_URL) ?? "https://www.mshikotap.co.tz";
  return raw.replace(/\/+$/, "");
}

async function call(path: string, init: RequestInit = {}) {
  const key = clean(process.env.SNIPPE_API_KEY);
  if (!key) throw new HttpError(503, "PAYMENTS_OFF", "Payments are not switched on yet. Please try again soon.");
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}

async function withSessionPaths(suffix: string, init: RequestInit) {
  let last: Response | undefined;
  for (const prefix of SESSION_PATHS) {
    const res = await call(`${prefix}${suffix}`, init);
    if (res.status !== 404) return res;
    last = res;
  }
  return last as Response;
}

type SnippeSession = {
  reference: string;
  status: string;
  amount: number;
  checkoutUrl?: string;
};

function readSession(json: unknown): SnippeSession {
  const data = ((json as { data?: Record<string, unknown> })?.data ?? {}) as Record<string, unknown>;
  const reference = typeof data.reference === "string" ? data.reference : "";
  if (!reference) throw new HttpError(502, "PAYMENTS_BAD_REPLY", "Payment provider sent an unexpected reply");
  return {
    reference,
    status: typeof data.status === "string" ? data.status : "pending",
    amount: typeof data.amount === "number" ? data.amount : 0,
    checkoutUrl: typeof data.checkout_url === "string" ? data.checkout_url : undefined,
  };
}

export async function createSession(input: {
  amount: number;
  description: string;
  metadata: Record<string, string | number | boolean>;
  redirectUrl: string;
  webhookUrl: string;
  customer?: { name?: string; email?: string };
}): Promise<SnippeSession> {
  let res: Response;
  try {
    res = await withSessionPaths("", {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        currency: "TZS",
        allowed_methods: ["mobile_money"],
        description: input.description.slice(0, 480),
        metadata: input.metadata,
        redirect_url: input.redirectUrl,
        webhook_url: input.webhookUrl,
        expires_in: 3600,
        ...(input.customer?.name || input.customer?.email
          ? {
              customer: {
                ...(input.customer.name ? { name: input.customer.name.slice(0, 200) } : {}),
                ...(input.customer.email ? { email: input.customer.email } : {}),
              },
            }
          : {}),
      }),
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "PAYMENTS_UNREACHABLE", "Could not reach the payment provider. Try again.");
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("[snippe] create session failed", res.status, JSON.stringify(json)?.slice(0, 400));
    if (res.status === 401 || res.status === 403) {
      throw new HttpError(503, "PAYMENTS_AUTH", "Payments are not set up correctly yet. Please tell support.");
    }
    throw new HttpError(502, "PAYMENTS_FAILED", "The payment provider could not start the payment. Try again.");
  }
  const session = readSession(json);
  if (!session.checkoutUrl) {
    throw new HttpError(502, "PAYMENTS_BAD_REPLY", "Payment provider did not return a checkout link");
  }
  return session;
}

export async function getSession(reference: string): Promise<SnippeSession | null> {
  try {
    const res = await withSessionPaths(`/${encodeURIComponent(reference)}`, { method: "GET" });
    if (!res.ok) return null;
    return readSession(await res.json());
  } catch {
    return null;
  }
}

export function verifyWebhook(rawBody: string, headers: Headers): boolean {
  const secret = clean(process.env.SNIPPE_WEBHOOK_SECRET);
  const timestamp = headers.get("x-webhook-timestamp");
  const signature = headers.get("x-webhook-signature");
  if (!secret || !timestamp || !signature) return false;

  const sent = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(sent)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - sent) > REPLAY_WINDOW_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(signature.trim().toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
