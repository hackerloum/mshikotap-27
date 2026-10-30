import { demoChallenges, demoLeaderboard, demoReferralStats } from "@/data/demo";
import { fromUnknown, ok } from "@/lib/errors/app-error";
import type { ApiResult, Challenge, LeaderboardEntry, ReferralStats } from "@/types";

export const challengesService = {
  async list(): Promise<ApiResult<Challenge[]>> {
    try {
      return ok(structuredClone(demoChallenges));
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async leaderboard(): Promise<ApiResult<LeaderboardEntry[]>> {
    return ok(structuredClone(demoLeaderboard));
  },

  async referralStats(): Promise<ApiResult<ReferralStats>> {
    return ok(structuredClone(demoReferralStats));
  },
};
