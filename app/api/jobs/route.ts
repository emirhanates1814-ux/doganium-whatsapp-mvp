import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getPendingJobForWorker, listRecentJobs, markJobRunning } from "@/lib/traffic-jobs";

function isWorkerAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-worker-api-key");
  return apiKey === env.workerApiKey;
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");

  if (mode === "worker") {
    if (!isWorkerAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await getPendingJobForWorker();
    if (!job) return NextResponse.json({ job: null });

    await markJobRunning(job.id);
    return NextResponse.json({ job });
  }

  const jobs = await listRecentJobs();
  return NextResponse.json({ jobs });
}
