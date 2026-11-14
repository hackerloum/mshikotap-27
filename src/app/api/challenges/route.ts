import { NextResponse } from "next/server";
import { auditNow } from "@/lib/server/audit";
import { col, db, HttpError, optStr, readJson, requireSession, respond, rows, str, amount } from "@/lib/server/http";
import type { Challenge, ChallengeType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const types: ChallengeType[] = ["referral_race", "weekly", "flash", "milestone"];

function withStatus(c: Challenge): Challenge {
  const now = Date.now();
  const status =
    now < new Date(c.startsAt).getTime() ? "upcoming" : now > new Date(c.endsAt).getTime() ? "ended" : "live";
  return { ...c, status };
}

export async function GET() {
  try {
    const snap = await db().collection(col.challenges).limit(100).get();
    const list = rows<Challenge>(snap)
      .map(withStatus)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return NextResponse.json({ ok: true, data: list });
  } catch (error) {
    const message = error instanceof HttpError ? error.message : "Could not load races";
    return NextResponse.json({ ok: false, error: { code: "UNAVAILABLE", message } }, { status: 503 });
  }
}

export async function POST(request: Request) {
  return respond(async () => {
    const { uid, profile } = await requireSession(request, ["admin"]);
    const body = await readJson<Record<string, unknown>>(request);
    const type = (types.includes(body.type as ChallengeType) ? body.type : "weekly") as ChallengeType;
    const startsAt = new Date(str(body.startsAt, "Start", 40));
    const endsAt = new Date(str(body.endsAt, "End", 40));
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new HttpError(400, "INVALID_INPUT", "End must be after start");
    }
    const challenge: Omit<Challenge, "id"> = {
      title: str(body.title, "Title", 120),
      description: optStr(body.description, 400) ?? "",
      type,
      rewardPool: amount(body.rewardPool, "Reward pool"),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      participants: 0,
      status: "upcoming",
    };
    const ref = await db().collection(col.challenges).add(challenge);
    await auditNow(db(), {
      actorId: uid,
      actorName: profile.displayName,
      action: "challenge.create",
      entityType: "challenge",
      entityId: ref.id,
      summary: `Created race "${challenge.title}" with TSh ${challenge.rewardPool} pool`,
    });
    return withStatus({ id: ref.id, ...challenge });
  }, 201);
}
