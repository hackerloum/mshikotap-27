import type { ApiResult } from "@/types";
import { fail } from "@/lib/errors/app-error";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Thin API abstraction over fetch. Feature modules should call this
 * (or domain services) instead of raw fetch for consistent error shapes.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

    const payload = (await response.json()) as ApiResult<T>;
    if (!response.ok && payload && "ok" in payload) return payload;
    if (!response.ok) {
      return fail({
        code: `HTTP_${response.status}`,
        message: "Request failed",
      });
    }
    return payload;
  } catch (error) {
    return fail({
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
    });
  }
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body }),
};
