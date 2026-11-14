import { api } from "@/lib/api-client";
import type { ApiResult, Withdrawal, WithdrawalMethod } from "@/types";

export const walletService = {
  listWithdrawals(): Promise<ApiResult<Withdrawal[]>> {
    return api<Withdrawal[]>("/api/withdrawals");
  },

  listAllWithdrawals(): Promise<ApiResult<Withdrawal[]>> {
    return api<Withdrawal[]>("/api/withdrawals?scope=all");
  },

  requestWithdrawal(input: {
    amount: number;
    method: WithdrawalMethod;
    destination: string;
  }): Promise<ApiResult<Withdrawal>> {
    return api<Withdrawal>("/api/withdrawals", { method: "POST", body: input });
  },

  updateStatus(id: string, status: Withdrawal["status"], notes?: string): Promise<ApiResult<Withdrawal>> {
    return api<Withdrawal>(`/api/withdrawals/${id}`, { method: "PATCH", body: { status, notes } });
  },
};
