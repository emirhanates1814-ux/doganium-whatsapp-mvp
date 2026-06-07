import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/env";
import { buildQuoteReadyMessage } from "@/lib/message-templates";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordWhatsAppMessage } from "@/lib/traffic-jobs";
import { sendWhatsappTextMessage } from "@/lib/whatsapp";

const sendMessageSchema = z.object({
  requestId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = sendMessageSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();

    const { data: requestData, error: requestError } = await supabase
      .from("traffic_quote_requests")
      .select("id, customer_phone, status")
      .eq("id", body.requestId)
      .single();

    if (requestError) throw requestError;

    if (requestData.status !== "parsed") {
      return NextResponse.json(
        { error: "Bu talep için gönderime yalnızca teklif hazır olduğunda izin verilir." },
        { status: 409 },
      );
    }

    const { data: resultData, error: resultError } = await supabase
      .from("traffic_quote_results")
      .select("*")
      .eq("request_id", body.requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resultError) throw resultError;

    if (!resultData) {
      return NextResponse.json({ error: "Teklif sonucu bulunamadı." }, { status: 404 });
    }

    const message = buildQuoteReadyMessage({
      cheapestCompany: resultData.cheapest_company,
      cheapestPrice: Number(resultData.cheapest_price),
      highestCompany: resultData.highest_company ?? undefined,
      highestPrice: resultData.highest_price ? Number(resultData.highest_price) : undefined,
      recommendedCompany: resultData.recommended_company ?? undefined,
      recommendedPrice: resultData.recommended_price ? Number(resultData.recommended_price) : undefined,
      pdfUrl: resultData.pdf_url ?? undefined,
      raw: resultData.raw_result_json,
    });

    await sendWhatsappTextMessage({
      to: requestData.customer_phone,
      message,
    });

    await supabase
      .from("traffic_quote_requests")
      .update({ status: "sent_to_customer", updated_at: new Date().toISOString() })
      .eq("id", body.requestId);

    await recordWhatsAppMessage({
      customerPhone: requestData.customer_phone,
      direction: "outgoing",
      body: message,
      status: "sent",
      requestId: body.requestId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz requestId." }, { status: 400 });
    }

    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
