import { NextResponse } from "next/server";
import { walletService } from "@/services/wallet.service";
import type { WithdrawalMethod } from "@/types";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId") || undefined;
  const result = await walletService.listWithdrawals(userId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId: string;
    amount: number;
    method: WithdrawalMethod;
    destination: string;
    availableBalance: number;
  };
  const result = await walletService.requestWithdrawal(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
