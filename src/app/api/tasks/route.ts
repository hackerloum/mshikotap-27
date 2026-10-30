import { NextResponse } from "next/server";
import { tasksService } from "@/services/tasks.service";
import type { TaskCategory } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") as TaskCategory | "all" | null) || "all";
  const query = searchParams.get("q") || undefined;
  const result = await tasksService.list({ category, query });
  const status = result.ok ? 200 : 400;
  return NextResponse.json(result, { status });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    taskId: string;
    userId: string;
    proofUrl?: string;
    notes?: string;
  };
  const result = await tasksService.submit(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
