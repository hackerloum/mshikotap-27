import { api } from "@/lib/api-client";
import type { ApiResult, Challenge, LeaderboardEntry, ReferralStats } from "@/types";

export const challengesService = {
  list(): Promise<ApiResult<Challenge[]>> {
    return api<Challenge[]>("/api/challenges", { auth: false });
  },

  create(input: {
    title: string;
    description?: string;
    type: Challenge["type"];
    rewardPool: number;
    startsAt: string;
    endsAt: string;
  }): Promise<ApiResult<Challenge>> {
    return api<Challenge>("/api/challenges", { method: "POST", body: input });
  },

  leaderboard(): Promise<ApiResult<LeaderboardEntry[]>> {
    return api<LeaderboardEntry[]>("/api/leaderboard", { auth: false });
  },

  referralStats(): Promise<ApiResult<ReferralStats>> {
    return api<ReferralStats>("/api/referrals");
  },
};
