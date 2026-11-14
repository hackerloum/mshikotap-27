import { api } from "@/lib/api-client";
import type { ApiResult, Withdrawal, WithdrawalMethod } from "@/types";

export interface EligibilityCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface Eligibility {
  checks: EligibilityCheck[];
  canWithdraw: boolean;
}

export const walletService = {
  listWithdrawals(): Promise<ApiResult<Withdrawal[]>> {
    return api<Withdrawal[]>("/api/withdrawals");
  },

  eligibility(): Promise<ApiResult<Eligibility>> {
    return api<Eligibility>("/api/withdrawals/eligibility");
  },

  requestWithdrawal(input: {
    amount: number;
    method: WithdrawalMethod;
    destination: string;
  }): Promise<ApiResult<Withdrawal>> {
    return api<Withdrawal>("/api/withdrawals", { method: "POST", body: input });
  },
};
