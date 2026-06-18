import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/env";
import {
  getTrafficJobResult,
  saveTrafficJobResult,
  updateTrafficJobStatus,
} from "@/lib/traffic-jobs";

const quoteSchema = z.object({
  company: z.string().min(1),
  premium: z.number().nonnegative(),
  currency: z.string().min(1).default("TRY"),
  description: z.string().optional(),
  pdfPath: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

const resultSchema = z.object({
  quotes: z.array(quoteSchema).min(1),
  cheapestPremium: z.number().nonnegative().optional(),
  highestPremium: z.number().nonnegative().optional(),
  summary: z.string().optional(),
  markCompleted: z.boolean().optional().default(true),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await getTrafficJobResult(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = resultSchema.parse(await request.json());
    const result = await saveTrafficJobResult(id, {
      quotes: body.quotes,
      cheapestPremium: body.cheapestPremium,
      highestPremium: body.highestPremium,
      summary: body.summary,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }

    if (body.markCompleted) {
      const statusResult = await updateTrafficJobStatus(id, "completed");

      if (!statusResult.ok) {
        return NextResponse.json(statusResult, { status: 500 });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid result payload.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return POST(request, context);
}
