import { getClientAuth } from "@/lib/firebase/client";
import { fromUnknown } from "@/lib/errors/app-error";
import { AppError } from "@/lib/errors/app-error";
import type { ApiResult } from "@/types";

export function deviceId() {
  if (typeof window === "undefined") return undefined;
  try {
    let id = window.localStorage.getItem("mt_device");
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem("mt_device", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function api<T>(path: string, options: Options = {}): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {};
    const device = deviceId();
    if (device) headers["x-device-id"] = device;
    if (options.auth !== false) {
      const auth = getClientAuth();
      await auth?.authStateReady();
      const token = await auth?.currentUser?.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    let json: ApiResult<T>;
    try {
      json = (await res.json()) as ApiResult<T>;
    } catch {
      throw new AppError("BAD_RESPONSE", "The server sent an unexpected reply", res.status);
    }
    return json;
  } catch (error) {
    return fromUnknown(error);
  }
}
