export type SystemSettings = {
  minWithdrawal: number;
  withdrawalFeePercent: number;
  referralBonus: number;
  maxReferralBonuses: number;
  dailyBonusBase: number;
  dailyBonusStep: number;

  minSecondsToSubmit: number;
  minSecondsBetweenSubmissions: number;
  maxSubmissionsPerDay: number;
  maxDailyQuestReward: number;

  maxPendingWithdrawals: number;
  minAccountAgeHours: number;
  minApprovedForWithdrawal: number;
  holdRiskScore: number;
  autoBanRiskScore: number;

  signupsOpen: boolean;
  questsOpen: boolean;
  withdrawalsOpen: boolean;
  announcement: string;
};

export const defaultSettings: SystemSettings = {
  minWithdrawal: 5000,
  withdrawalFeePercent: 2.5,
  referralBonus: 500,
  maxReferralBonuses: 50,
  dailyBonusBase: 100,
  dailyBonusStep: 50,

  minSecondsToSubmit: 15,
  minSecondsBetweenSubmissions: 10,
  maxSubmissionsPerDay: 25,
  maxDailyQuestReward: 30000,

  maxPendingWithdrawals: 1,
  minAccountAgeHours: 24,
  minApprovedForWithdrawal: 3,
  holdRiskScore: 60,
  autoBanRiskScore: 120,

  signupsOpen: true,
  questsOpen: true,
  withdrawalsOpen: true,
  announcement: "",
};

type NumberRule = { min: number; max: number; integer?: boolean };

export const numberRules: Record<
  Exclude<keyof SystemSettings, "signupsOpen" | "questsOpen" | "withdrawalsOpen" | "announcement">,
  NumberRule
> = {
  minWithdrawal: { min: 1000, max: 5_000_000, integer: true },
  withdrawalFeePercent: { min: 0, max: 30 },
  referralBonus: { min: 0, max: 100_000, integer: true },
  maxReferralBonuses: { min: 0, max: 10_000, integer: true },
  dailyBonusBase: { min: 0, max: 10_000, integer: true },
  dailyBonusStep: { min: 0, max: 10_000, integer: true },
  minSecondsToSubmit: { min: 0, max: 3600, integer: true },
  minSecondsBetweenSubmissions: { min: 0, max: 3600, integer: true },
  maxSubmissionsPerDay: { min: 1, max: 1000, integer: true },
  maxDailyQuestReward: { min: 1000, max: 10_000_000, integer: true },
  maxPendingWithdrawals: { min: 1, max: 10, integer: true },
  minAccountAgeHours: { min: 0, max: 720, integer: true },
  minApprovedForWithdrawal: { min: 0, max: 500, integer: true },
  holdRiskScore: { min: 10, max: 1000, integer: true },
  autoBanRiskScore: { min: 20, max: 2000, integer: true },
};

export type PublicConfig = Pick<
  SystemSettings,
  | "minWithdrawal"
  | "withdrawalFeePercent"
  | "referralBonus"
  | "dailyBonusBase"
  | "dailyBonusStep"
  | "signupsOpen"
  | "questsOpen"
  | "withdrawalsOpen"
  | "announcement"
>;

export function toPublicConfig(s: SystemSettings): PublicConfig {
  return {
    minWithdrawal: s.minWithdrawal,
    withdrawalFeePercent: s.withdrawalFeePercent,
    referralBonus: s.referralBonus,
    dailyBonusBase: s.dailyBonusBase,
    dailyBonusStep: s.dailyBonusStep,
    signupsOpen: s.signupsOpen,
    questsOpen: s.questsOpen,
    withdrawalsOpen: s.withdrawalsOpen,
    announcement: s.announcement,
  };
}

export type RiskLevel = "low" | "medium" | "high";

export function riskLevel(score: number, hold = defaultSettings.holdRiskScore): RiskLevel {
  if (score >= hold) return "high";
  if (score >= Math.ceil(hold / 2)) return "medium";
  return "low";
}

export type FlagKind =
  | "duplicate_proof"
  | "proof_is_target"
  | "too_fast"
  | "rate_limited"
  | "multi_account_device"
  | "referral_same_device"
  | "shared_payout_destination"
  | "admin_fraud_reject"
  | "auto_suspended";

export const flagLabels: Record<FlagKind, string> = {
  duplicate_proof: "Reused proof",
  proof_is_target: "Quest link sent as proof",
  too_fast: "Submitted too fast",
  rate_limited: "Hit a daily limit",
  multi_account_device: "Same device, other account",
  referral_same_device: "Referral from same device",
  shared_payout_destination: "Payout number used by another account",
  admin_fraud_reject: "Rejected as fraud by admin",
  auto_suspended: "Auto-suspended",
};
