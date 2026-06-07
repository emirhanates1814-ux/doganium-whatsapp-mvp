import { NextRequest, NextResponse } from "next/server";
import { getSafeErrorMessage } from "@/lib/env";
import { getNextJobForWorker, markJobRunning } from "@/lib/traffic-jobs";
import { authorizeWorker, handleWorkerResult } from "@/lib/worker-api";

export async function GET(request: NextRequest) {
  const auth = authorizeWorker(request);
  if (auth) return auth;

  try {
    const job = await getNextJobForWorker();
    if (!job) return NextResponse.json({ job: null });

    await markJobRunning(job.id);
    return NextResponse.json({ job: { ...job, status: "running_doganium" } });
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleWorkerResult(request);
}

export async function PATCH(request: NextRequest) {
  return handleWorkerResult(request);
}
