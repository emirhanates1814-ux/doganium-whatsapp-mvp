import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  appendRuntimeLog,
  readRuntimeLogs,
  runtimeLogLevels,
  runtimeLogSources,
} from "@/lib/runtime-log";

export const runtime = "nodejs";

const logSchema = z.object({
  level: z.enum(runtimeLogLevels),
  source: z.enum(runtimeLogSources),
  jobId: z.string().max(120).optional().nullable(),
  plate: z.string().max(24).optional().nullable(),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  meta: z.record(z.string(), z.unknown()).optional().nullable(),
}).strict();

export async function GET(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const parsedLimit = rawLimit === null ? 100 : Number(rawLimit);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 500)
    : 100;

  const events = await readRuntimeLogs(limit);
  return NextResponse.json(
    { ok: true, order: "newest-first", events },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = logSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid log payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const event = await appendRuntimeLog(parsed.data);
  return NextResponse.json({ ok: true, data: event }, { status: 201 });
}
