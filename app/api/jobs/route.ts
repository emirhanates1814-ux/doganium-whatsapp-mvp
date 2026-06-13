import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/env";
import { createTrafficJob, isTrafficJobStatus, listTrafficJobs } from "@/lib/traffic-jobs";
import { normalizeTrafficInput, parseTrafficMessage } from "@/lib/traffic-parser";

const createJobSchema = z.object({
  customerPhone: z.string().min(5).max(32),
  customerName: z.string().max(120).optional(),
  tckn: z.string().optional(),
  plate: z.string().optional(),
  documentSerial: z.string().optional(),
  birthDate: z.string().optional(),
  rawMessage: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const limitValue = request.nextUrl.searchParams.get("limit");
  const limit = limitValue ? Number(limitValue) : undefined;

  if (status && !isTrafficJobStatus(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid status filter." },
      { status: 400 },
    );
  }

  if (limitValue && (!Number.isInteger(limit) || Number(limit) < 1)) {
    return NextResponse.json({ ok: false, error: "Invalid limit filter." }, { status: 400 });
  }

  const statusFilter = status && isTrafficJobStatus(status) ? status : undefined;
  const result = await listTrafficJobs({ status: statusFilter, limit });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = createJobSchema.parse(await request.json());
    const parsed = body.rawMessage ? parseTrafficMessage(body.rawMessage) : null;
    const normalized = normalizeTrafficInput({
      tckn: body.tckn ?? parsed?.data?.tckn,
      plate: body.plate ?? parsed?.data?.plate,
      documentSerial: body.documentSerial ?? parsed?.data?.documentSerial,
      birthDate: body.birthDate ?? parsed?.data?.birthDate,
    });

    const missingFields = [
      ["tckn", normalized.tckn],
      ["plate", normalized.plate],
      ["documentSerial", normalized.documentSerial],
      ["birthDate", normalized.birthDate],
    ]
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Traffic job is missing required fields.",
          details: { missingFields, parser: parsed },
        },
        { status: 400 },
      );
    }

    const result = await createTrafficJob({
      customerPhone: body.customerPhone,
      customerName: body.customerName ?? null,
      tckn: normalized.tckn,
      plate: normalized.plate,
      documentSerial: normalized.documentSerial,
      birthDate: normalized.birthDate,
      rawMessage: body.rawMessage ?? null,
      source: "manual",
      status: "pending",
    });

    return NextResponse.json(result, { status: result.ok ? 201 : 500 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid job payload.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage(error) },
      { status: 500 },
    );
  }
}
