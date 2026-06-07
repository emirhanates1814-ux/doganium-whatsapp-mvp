import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { markJobFailed, saveJobResult } from "@/lib/traffic-jobs";

const resultSchema = z.object({
  status: z.enum(["parsed", "failed"]),
  errorMessage: z.string().optional(),
  result: z
    .object({
      cheapestCompany: z.string(),
      cheapestPrice: z.number(),
      highestCompany: z.string().optional(),
      highestPrice: z.number().optional(),
      recommendedCompany: z.string().optional(),
      recommendedPrice: z.number().optional(),
      pdfUrl: z.string().optional(),
      raw: z.unknown().optional()
    })
    .optional()
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const apiKey = request.headers.get("x-worker-api-key");
  if (apiKey !== env.workerApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = resultSchema.parse(await request.json());

  if (body.status === "failed") {
    await markJobFailed(id, body.errorMessage ?? "Worker failed without details");
    return NextResponse.json({ ok: true });
  }

  if (!body.result) {
    return NextResponse.json({ error: "Result payload is required" }, { status: 400 });
  }

  await saveJobResult({ requestId: id, result: body.result });
  return NextResponse.json({ ok: true });
}
