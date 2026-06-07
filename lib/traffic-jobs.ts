import { supabaseAdmin } from "./supabase-admin";
import { maskBirthDate, maskDocumentSerial, maskTckn } from "./masking";
import type { ParsedTrafficRequest, TrafficJobStatus, TrafficQuoteResult } from "@/types/traffic";

export async function createTrafficQuoteRequest(input: {
  customerPhone: string;
  whatsappMessageId?: string;
  rawMessage: string;
  parsed: ParsedTrafficRequest;
  status: TrafficJobStatus;
  missingFields: string[];
}) {
  const { data, error } = await supabaseAdmin
    .from("traffic_quote_requests")
    .insert({
      customer_phone: input.customerPhone,
      whatsapp_message_id: input.whatsappMessageId,
      raw_message: input.rawMessage,
      tckn: input.parsed.tckn ?? null,
      tckn_masked: maskTckn(input.parsed.tckn),
      plate: input.parsed.plate ?? null,
      document_serial_no: input.parsed.documentSerialNo ?? null,
      document_serial_no_masked: maskDocumentSerial(input.parsed.documentSerialNo),
      birth_date: input.parsed.birthDate ?? null,
      birth_date_masked: maskBirthDate(input.parsed.birthDate),
      status: input.status,
      missing_fields: input.missingFields
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingJobForWorker() {
  const { data, error } = await supabaseAdmin
    .from("traffic_quote_requests")
    .select("id, customer_phone, tckn, plate, document_serial_no, birth_date, status")
    .eq("status", "ready_for_worker")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function markJobRunning(id: string) {
  const { error } = await supabaseAdmin
    .from("traffic_quote_requests")
    .update({ status: "running_doganium", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function saveJobResult(input: {
  requestId: string;
  result: TrafficQuoteResult;
  status?: TrafficJobStatus;
}) {
  const { error: resultError } = await supabaseAdmin.from("traffic_quote_results").insert({
    request_id: input.requestId,
    pdf_url: input.result.pdfUrl ?? null,
    cheapest_company: input.result.cheapestCompany,
    cheapest_price: input.result.cheapestPrice,
    highest_company: input.result.highestCompany ?? null,
    highest_price: input.result.highestPrice ?? null,
    recommended_company: input.result.recommendedCompany ?? null,
    recommended_price: input.result.recommendedPrice ?? null,
    raw_result_json: input.result.raw ?? null
  });

  if (resultError) throw resultError;

  const { error: updateError } = await supabaseAdmin
    .from("traffic_quote_requests")
    .update({ status: input.status ?? "parsed", updated_at: new Date().toISOString() })
    .eq("id", input.requestId);

  if (updateError) throw updateError;
}

export async function markJobFailed(id: string, errorMessage: string) {
  const { error } = await supabaseAdmin
    .from("traffic_quote_requests")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 1000),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw error;
}

export async function listRecentJobs() {
  const { data, error } = await supabaseAdmin
    .from("traffic_quote_requests")
    .select(
      "id, customer_phone, tckn_masked, plate, document_serial_no_masked, birth_date_masked, status, error_message, created_at, updated_at, traffic_quote_results(*)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
