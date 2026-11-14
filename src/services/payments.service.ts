import { api } from "@/lib/api-client";
import type { ApiResult, PaymentKind, PaymentRecord } from "@/types";

export const paymentsService = {
  checkout(kind: PaymentKind, amount?: number): Promise<ApiResult<{ id: string; checkoutUrl: string }>> {
    return api("/api/payments/checkout", { method: "POST", body: { kind, amount } });
  },
  get: (id: string): Promise<ApiResult<PaymentRecord>> => api(`/api/payments/${id}`),
  list: (): Promise<ApiResult<PaymentRecord[]>> => api("/api/payments"),
  setRole: (role: "user" | "advertiser"): Promise<ApiResult<{ role: string }>> =>
    api("/api/me/role", { method: "POST", body: { role } }),
};
