import { NextRequest } from "next/server";
import { handleWorkerResult } from "@/lib/worker-api";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleWorkerResult(request, id);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleWorkerResult(request, id);
}
