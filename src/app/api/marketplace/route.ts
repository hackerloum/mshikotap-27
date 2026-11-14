import { NextResponse } from "next/server";
import { col, db, rows } from "@/lib/server/http";
import type { MarketplaceListing } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.toLowerCase();
    const snap = await db().collection(col.listings).limit(200).get();
    const list = rows<MarketplaceListing>(snap)
      .filter((l) => !category || category === "all" || l.category === category)
      .filter(
        (l) =>
          !q ||
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          (l.tags ?? []).some((t) => t.includes(q)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ ok: true, data: list });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "UNAVAILABLE", message: "Could not load the marketplace" } },
      { status: 503 },
    );
  }
}
