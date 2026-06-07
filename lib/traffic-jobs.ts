import { getSupabaseAdminClient } from "./supabase-admin";
import { maskBirthDate, maskDocumentSerial, maskTckn } from "./masking";
import type { Json } from "@/types/database";
import type { ParsedTrafficRequest, TrafficJobStatus, TrafficQuoteResult } from "@/types/traffic";

export type WorkerJob = {
  id: string;
  customer_phone: string;
  tckn: string;
  plate: string;
  document_serial_no: string;
  birth_date: string;
  status: TrafficJobStatus;
};

export type DashboardRequestRow = {
  id: string;
  customer_phone: string;
  plate: string | null;
  status: TrafficJobStatus;
  created_at: string;
};

export type DashboardResultRow = {
  id: string;
  request_id: string;
  cheapest_company: string;
  cheapest_price: number | string;
  highest_company: string | null;
  highest_price: number | string | null;
  recommended_company: string | null;
  recommended_price: number | string | null;
  created_at: string;
};

export type DashboardData = {
  requests: DashboardRequestRow[];
  resultsByRequest: Map<string, DashboardResultRow>;
  totalCount: number;
};

export async function createTrafficQuoteRequest(input: {
  customerPhone: string;
  whatsappMessageId?: string;
  rawMessage: string;
  parsed: ParsedTrafficRequest;
  status: TrafficJobStatus;
  missingFields: string[];
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("traffic_quote_requests")
    .insert({
      customer_phone: input.customerPhone,
      whatsapp_message_id: input.whatsappMessageId ?? null,
      raw_message: input.rawMessage,
      tckn: input.parsed.tckn ?? null,
      tckn_masked: maskTckn(input.parsed.tckn),
      plate: input.parsed.plate ?? null,
      document_serial_no: input.parsed.documentSerialNo ?? null,
      document_serial_no_masked: maskDocumentSerial(input.parsed.documentSerialNo),
      birth_date: input.parsed.birthDate ?? null,
      birth_date_masked: maskBirthDate(input.parsed.birthDate),
      status: input.status,
      missing_fields: input.missingFields,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function recordWhatsAppMessage(input: {
  customerPhone: string;
  whatsappMessageId?: string | null;
  direction: "incoming" | "outgoing";
  body: string;
  status?: string | null;
  requestId?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("whatsapp_messages").insert({
    customer_phone: input.customerPhone,
    whatsapp_message_id: input.whatsappMessageId ?? null,
    direction: input.direction,
    body: input.body,
    status: input.status ?? null,
    request_id: input.requestId ?? null,
  });

  if (error) throw error;
}

export async function getNextJobForWorker(): Promise<WorkerJob | null> {
  const supabase = getSupabaseAdminClient();

  for (const status of ["ready_for_worker", "pending"] satisfies TrafficJobStatus[]) {
    const { data, error } = await supabase
      .from("traffic_quote_requests")
      .select("id, customer_phone, tckn, plate, document_serial_no, birth_date, status")
      .eq("status", status)
      .not("tckn", "is", null)
      .not("plate", "is", null)
      .not("document_serial_no", "is", null)
      .not("birth_date", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data?.tckn && data.plate && data.document_serial_no && data.birth_date) {
      return {
        id: data.id,
        customer_phone: data.customer_phone,
        tckn: data.tckn,
        plate: data.plate,
        document_serial_no: data.document_serial_no,
        birth_date: data.birth_date,
        status: data.status,
      };
    }
  }

  return null;
}

export async function markJobRunning(id: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
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
  const supabase = getSupabaseAdminClient();
  const { error: resultError } = await supabase.from("traffic_quote_results").insert({
    request_id: input.requestId,
    pdf_url: input.result.pdfUrl ?? null,
    cheapest_company: input.result.cheapestCompany,
    cheapest_price: input.result.cheapestPrice,
    highest_company: input.result.highestCompany ?? null,
    highest_price: input.result.highestPrice ?? null,
    recommended_company: input.result.recommendedCompany ?? null,
    recommended_price: input.result.recommendedPrice ?? null,
    raw_result_json: (input.result.raw ?? null) as Json | null,
  });

  if (resultError) throw resultError;

  const { error: updateError } = await supabase
    .from("traffic_quote_requests")
    .update({ status: input.status ?? "parsed", updated_at: new Date().toISOString() })
    .eq("id", input.requestId);

  if (updateError) throw updateError;
}

export async function markJobFailed(id: string, errorMessage: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("traffic_quote_requests")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function listDashboardData(): Promise<DashboardData> {
  // Auth yokken dashboard'u RLS policy açmadan server-side admin client ile okuyoruz.
  const supabase = getSupabaseAdminClient();
  const {
    data: requestData,
    error: requestError,
    count,
  } = await supabase
    .from("traffic_quote_requests")
    .select("id, customer_phone, plate, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  if (requestError) throw requestError;

  const requests = requestData ?? [];
  const requestIds = requests.map((request) => request.id);
  const resultsByRequest = new Map<string, DashboardResultRow>();

  if (requestIds.length > 0) {
    const { data: resultData, error: resultError } = await supabase
      .from("traffic_quote_results")
      .select(
        "id, request_id, cheapest_company, cheapest_price, highest_company, highest_price, recommended_company, recommended_price, created_at",
      )
      .in("request_id", requestIds)
      .order("created_at", { ascending: false });

    if (resultError) throw resultError;

    for (const result of resultData ?? []) {
      if (!resultsByRequest.has(result.request_id)) {
        resultsByRequest.set(result.request_id, result);
      }
    }
  }

  return {
    requests,
    resultsByRequest,
    totalCount: count ?? requests.length,
  };
}

export async function listRecentJobs() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("traffic_quote_requests")
    .select(
      "id, customer_phone, tckn_masked, plate, document_serial_no_masked, birth_date_masked, status, error_message, created_at, updated_at, traffic_quote_results(*)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
