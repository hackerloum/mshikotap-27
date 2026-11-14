import "server-only";
import type { SystemSettings } from "@/config/system";
import type { SecurityDoc } from "@/lib/server/security";
import type { UserProfile, Withdrawal } from "@/types";

export type EligibilityCheck = { key: string; label: string; ok: boolean; detail: string };

export const ACTIVE_PAYOUT: Withdrawal["status"][] = ["pending", "under_review", "approved", "processing"];

export function evaluateEligibility(
  profile: UserProfile,
  sec: SecurityDoc,
  settings: SystemSettings,
  activePayouts: number,
): { checks: EligibilityCheck[]; canWithdraw: boolean } {
  const ageHours = (Date.now() - new Date(profile.createdAt).getTime()) / 3_600_000;
  const waitHours = Math.max(0, Math.ceil(settings.minAccountAgeHours - ageHours));
  const balance = profile.wallet.balance;

  const checks: EligibilityCheck[] = [
    {
      key: "open",
      label: "Cash outs are open",
      ok: settings.withdrawalsOpen,
      detail: settings.withdrawalsOpen ? "Open" : "Paused for a moment. Check back soon.",
    },
    {
      key: "balance",
      label: `Reach TSh ${settings.minWithdrawal.toLocaleString("en-US")}`,
      ok: balance >= settings.minWithdrawal,
      detail: `TSh ${Math.round(balance).toLocaleString("en-US")} / TSh ${settings.minWithdrawal.toLocaleString("en-US")}`,
    },
    {
      key: "approved",
      label: `Get ${settings.minApprovedForWithdrawal} quests approved`,
      ok: sec.approvedCount >= settings.minApprovedForWithdrawal,
      detail: `${Math.min(sec.approvedCount, settings.minApprovedForWithdrawal)} / ${settings.minApprovedForWithdrawal}`,
    },
    {
      key: "age",
      label: `Account is ${settings.minAccountAgeHours}h old`,
      ok: waitHours === 0,
      detail: waitHours === 0 ? "Done" : `Unlocks in ${waitHours}h`,
    },
    {
      key: "standing",
      label: "Account in good standing",
      ok: sec.trusted || sec.riskScore < settings.holdRiskScore,
      detail: sec.trusted || sec.riskScore < settings.holdRiskScore ? "Good" : "On hold while we review your activity",
    },
    {
      key: "pending",
      label: "No other payout waiting",
      ok: activePayouts < settings.maxPendingWithdrawals,
      detail: activePayouts < settings.maxPendingWithdrawals ? "Clear" : "Wait for your current payout",
    },
  ];
  return { checks, canWithdraw: checks.every((c) => c.ok) };
}

/** Normalises a Tanzanian mobile money number to +255XXXXXXXXX, or returns null. */
export function normalizeTzPhone(raw: string) {
  const digits = raw.replace(/[\s\-().]/g, "");
  const match = /^(?:\+?255|0)([67]\d{8})$/.exec(digits);
  return match ? `+255${match[1]}` : null;
}
