import { siteConfig } from "@/config/site";
import { demoWithdrawals } from "@/data/demo";
import { AppError, fromUnknown, ok } from "@/lib/errors/app-error";
import { activityService } from "@/services/activity.service";
import type { ApiResult, Withdrawal, WithdrawalMethod } from "@/types";

let withdrawals = structuredClone(demoWithdrawals);

export const walletService = {
  async listWithdrawals(userId?: string): Promise<ApiResult<Withdrawal[]>> {
    const result = userId
      ? withdrawals.filter((w) => w.userId === userId)
      : withdrawals;
    return ok(result);
  },

  async requestWithdrawal(input: {
    userId: string;
    amount: number;
    method: WithdrawalMethod;
    destination: string;
    availableBalance: number;
  }): Promise<ApiResult<Withdrawal>> {
    try {
      if (input.amount < siteConfig.minWithdrawal) {
        throw new AppError(
          "MIN_WITHDRAWAL",
          `Minimum withdrawal is $${siteConfig.minWithdrawal}`,
        );
      }
      if (input.amount > input.availableBalance) {
        throw new AppError("INSUFFICIENT_FUNDS", "Insufficient wallet balance");
      }
      const fee = Number(
        ((input.amount * siteConfig.withdrawalFeePercent) / 100).toFixed(2),
      );
      const withdrawal: Withdrawal = {
        id: `wd-${Date.now()}`,
        userId: input.userId,
        amount: input.amount,
        fee,
        netAmount: Number((input.amount - fee).toFixed(2)),
        method: input.method,
        destination: input.destination,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      withdrawals = [withdrawal, ...withdrawals];
      await activityService.log({
        actorId: input.userId,
        action: "wallet.withdraw.request",
        entityType: "withdrawal",
        entityId: withdrawal.id,
        metadata: { amount: input.amount, method: input.method },
      });
      return ok(withdrawal);
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async updateStatus(
    id: string,
    status: Withdrawal["status"],
    actorId: string,
    notes?: string,
  ): Promise<ApiResult<Withdrawal>> {
    try {
      const index = withdrawals.findIndex((w) => w.id === id);
      if (index < 0) throw new AppError("NOT_FOUND", "Withdrawal not found", 404);
      const updated: Withdrawal = {
        ...withdrawals[index],
        status,
        notes,
        processedAt: new Date().toISOString(),
      };
      withdrawals[index] = updated;
      await activityService.log({
        actorId,
        action: `wallet.withdraw.${status}`,
        entityType: "withdrawal",
        entityId: id,
      });
      return ok(updated);
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
