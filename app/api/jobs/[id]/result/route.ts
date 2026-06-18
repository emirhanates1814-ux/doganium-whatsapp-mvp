import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/env";
import { appendRuntimeLog } from "@/lib/runtime-log";
import {
  getTrafficJob,
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
  let jobId: string | undefined;
  let plate: string | undefined;

  try {
    const { id } = await context.params;
    jobId = id;
    const body = resultSchema.parse(await request.json());
    const job = await getTrafficJob(id);
    plate = job.ok ? job.data?.plate ?? undefined : undefined;
    const result = await saveTrafficJobResult(id, {
      quotes: body.quotes,
      cheapestPremium: body.cheapestPremium,
      highestPremium: body.highestPremium,
      summary: body.summary,
    });

    if (!result.ok) {
      await appendRuntimeLog({
        level: "error",
        source: "quote",
        jobId: id,
        plate,
        title: "Teklif sonucu kaydedilemedi",
        message: result.error,
      });
      return NextResponse.json(result, { status: 500 });
    }

    await appendRuntimeLog({
      level: "success",
      source: "quote",
      jobId: id,
      plate,
      title: "Teklif sonucu kaydedildi",
      message: `${body.quotes.length} teklif yerel sonuç kaydına yazıldı.`,
      meta: {
        quoteCount: body.quotes.length,
        cheapestPremium: body.cheapestPremium,
        highestPremium: body.highestPremium,
      },
    });

    if (body.markCompleted) {
      const statusResult = await updateTrafficJobStatus(id, "completed");

      if (!statusResult.ok) {
        await appendRuntimeLog({
          level: "error",
          source: "quote",
          jobId: id,
          plate,
          title: "İş tamamlandı durumuna alınamadı",
          message: statusResult.error,
        });
        return NextResponse.json(statusResult, { status: 500 });
      }

      await appendRuntimeLog({
        level: "success",
        source: "worker",
        jobId: id,
        plate,
        title: "Yerel iş tamamlandı",
        message: "Teklif sonucu hazırlandı ve iş tamamlandı durumuna alındı.",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      await appendRuntimeLog({
        level: "warning",
        source: "quote",
        jobId,
        plate,
        title: "Geçersiz teklif sonucu isteği",
        message: "API, şema doğrulamasından geçmeyen teklif sonucu isteğini reddetti.",
        meta: { fields: Object.keys(error.flatten().fieldErrors) },
      });
      return NextResponse.json(
        { ok: false, error: "Invalid result payload.", details: error.flatten() },
        { status: 400 },
      );
    }

    const message = getSafeErrorMessage(error);
    await appendRuntimeLog({
      level: "error",
      source: "quote",
      jobId,
      plate,
      title: "Teklif sonucu API hatası",
      message,
    });

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return POST(request, context);
}
