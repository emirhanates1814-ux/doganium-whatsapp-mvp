import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildQuoteReadyMessage } from "@/lib/message-templates";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";

const sendMessageSchema = z.object({
  requestId: z.string().uuid()
});

export async function POST(request: Request) {
  const body = sendMessageSchema.parse(await request.json());

  const { data: requestData, error: requestError } = await supabaseAdmin
    .from("traffic_quote_requests")
    .select("id, customer_phone")
    .eq("id", body.requestId)
    .single();

  if (requestError) throw requestError;

  const { data: resultData, error: resultError } = await supabaseAdmin
    .from("traffic_quote_results")
    .select("*")
    .eq("request_id", body.requestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (resultError) throw resultError;

  const message = buildQuoteReadyMessage({
    cheapestCompany: resultData.cheapest_company,
    cheapestPrice: Number(resultData.cheapest_price),
    highestCompany: resultData.highest_company ?? undefined,
    highestPrice: resultData.highest_price ? Number(resultData.highest_price) : undefined,
    recommendedCompany: resultData.recommended_company ?? undefined,
    recommendedPrice: resultData.recommended_price ? Number(resultData.recommended_price) : undefined,
    pdfUrl: resultData.pdf_url ?? undefined,
    raw: resultData.raw_result_json
  });

  await sendWhatsAppTextMessage({
    to: requestData.customer_phone,
    body: message
  });

  await supabaseAdmin
    .from("traffic_quote_requests")
    .update({ status: "sent_to_customer", updated_at: new Date().toISOString() })
    .eq("id", body.requestId);

  return NextResponse.json({ ok: true, message });
}
