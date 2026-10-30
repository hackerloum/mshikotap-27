import type { ApiErrorShape, ApiFailure, ApiResult, ApiSuccess } from "@/types";

export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toShape(): ApiErrorShape {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(error: ApiErrorShape): ApiFailure {
  return { ok: false, error };
}

export function fromUnknown(error: unknown): ApiFailure {
  if (error instanceof AppError) {
    return fail(error.toShape());
  }
  if (error instanceof Error) {
    return fail({ code: "INTERNAL_ERROR", message: error.message });
  }
  return fail({ code: "INTERNAL_ERROR", message: "Unexpected error" });
}

export function assertResult<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new AppError(result.error.code, result.error.message);
  }
  return result.data;
}
