import { col, db, requireSession, respond, rows } from "@/lib/server/http";
import { loadSecurity } from "@/lib/server/security";
import { getSettings } from "@/lib/server/settings";
import { ACTIVE_PAYOUT, evaluateEligibility } from "@/lib/server/withdrawals";
import type { Withdrawal } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request);
    const settings = await getSettings();
    const [sec, mine] = await Promise.all([
      loadSecurity(db(), uid),
      db().collection(col.withdrawals).where("userId", "==", uid).get(),
    ]);
    const active = rows<Withdrawal>(mine).filter((w) => ACTIVE_PAYOUT.includes(w.status)).length;
    return evaluateEligibility(profile, sec, settings, active);
  });
}
