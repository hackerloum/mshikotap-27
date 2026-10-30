import { NextResponse } from "next/server";
import { campaignsService } from "@/services/campaigns.service";
import type { CampaignType } from "@/types";

export async function GET(request: Request) {
  const advertiserId =
    new URL(request.url).searchParams.get("advertiserId") || undefined;
  const result = await campaignsService.list(advertiserId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    advertiserId: string;
    title: string;
    type: CampaignType;
    budgetCredits: number;
    costPerAction: number;
    instructions: string;
    targetUrl?: string;
  };
  const result = await campaignsService.create(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
