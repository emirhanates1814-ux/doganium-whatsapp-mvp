import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSafeErrorMessage, getWorkerApiKey } from "@/lib/env";
import { markJobFailed, saveJobResult } from "@/lib/traffic-jobs";

const workerResultSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["parsed", "failed"]),
  errorMessage: z.string().max(1000).optional(),
  result: z
    .object({
      cheapestCompany: z.string().min(1),
      cheapestPrice: z.number().nonnegative(),
      highestCompany: z.string().min(1).optional(),
      highestPrice: z.number().nonnegative().optional(),
      recommendedCompany: z.string().min(1).optional(),
      recommendedPrice: z.number().nonnegative().optional(),
      pdfUrl: z.string().url().nullable().optional(),
      raw: z.unknown().optional(),
    })
    .optional(),
});

export function authorizeWorker(request: NextRequest): NextResponse | null {
  let expectedKey: string;

  try {
    expectedKey = getWorkerApiKey();
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerKey = request.headers.get("x-worker-api-key");
  const providedKey = bearer ?? headerKey;

  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function handleWorkerResult(request: NextRequest, requestIdFromPath?: string) {
  const auth = authorizeWorker(request);
  if (auth) return auth;

  try {
    const rawBody = await request.json();
    const body = workerResultSchema.parse({
      ...rawBody,
      requestId: requestIdFromPath ?? rawBody.requestId,
    });

    if (body.status === "failed") {
      await markJobFailed(body.requestId, body.errorMessage ?? "Worker failed without details");
      return NextResponse.json({ ok: true });
    }

    if (!body.result) {
      return NextResponse.json({ error: "Result payload is required." }, { status: 400 });
    }

    await saveJobResult({
      requestId: body.requestId,
      result: { ...body.result, pdfUrl: body.result.pdfUrl ?? undefined },
      status: "parsed",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid worker payload." }, { status: 400 });
    }

    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
