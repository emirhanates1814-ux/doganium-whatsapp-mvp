import {
  createTrafficJob as createLocalTrafficJob,
  getTrafficJob as getLocalTrafficJob,
  getTrafficJobResult as getLocalTrafficJobResult,
  listTrafficJobs as listLocalTrafficJobs,
  saveTrafficJobResult as saveLocalTrafficJobResult,
  updateTrafficJobStatus as updateLocalTrafficJobStatus,
  type CreateLocalTrafficJobInput,
  type ListLocalTrafficJobsFilters,
  type LocalTrafficJob,
  type LocalTrafficJobResult,
} from "./local-traffic-store";
import type {
  LegacyTrafficJobStatus,
  ParsedTrafficRequest,
  TrafficJobResultPayload,
  TrafficQuoteResult,
} from "@/types/traffic";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

export type CreateTrafficJobInput = CreateLocalTrafficJobInput;
export type ListTrafficJobsFilters = ListLocalTrafficJobsFilters;
export type TrafficJobRow = LocalTrafficJob;
export type TrafficJobResultRow = LocalTrafficJobResult;

export type WorkerJob = {
  id: string;
  customer_phone: string;
  tckn: string;
  plate: string;
  document_serial_no: string;
  birth_date: string;
  status: LegacyTrafficJobStatus;
};

export type DashboardRequestRow = {
  id: string;
  customer_phone: string;
  plate: string | null;
  status: LegacyTrafficJobStatus;
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

const trafficRequestStatuses = [
  "pending",
  "running",
  "waiting_mfa",
  "completed",
  "failed",
  "cancelled",
] as const;

export function isTrafficJobStatus(value: string | null): value is TrafficJobRow["status"] {
  return trafficRequestStatuses.includes(value as TrafficJobRow["status"]);
}

export async function createTrafficJobFromMessage(input: {
  customerPhone: string;
  rawMessage: string;
  source?: "manual" | "whatsapp" | "test";
}): Promise<ServiceResult<TrafficJobRow>> {
  const { parseTrafficMessage } = await import("./traffic-parser");
  const parsed = parseTrafficMessage(input.rawMessage);

  if (!parsed.ok) {
    return {
      ok: false,
      error: "Traffic message is missing required fields.",
      details: {
        missingFields: parsed.missingFields ?? [],
        errors: parsed.errors ?? [],
        data: parsed.data ?? {},
      },
    };
  }

  return createTrafficJob({
    customerPhone: input.customerPhone,
    rawMessage: input.rawMessage,
    source: input.source ?? "whatsapp",
    tckn: parsed.data?.tckn,
    plate: parsed.data?.plate,
    documentSerial: parsed.data?.documentSerial,
    birthDate: parsed.data?.birthDate,
    status: "pending",
  });
}

export async function createTrafficJob(
  input: CreateTrafficJobInput,
): Promise<ServiceResult<TrafficJobRow>> {
  try {
    const data = await createLocalTrafficJob(input);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Traffic job could not be created.", details: error };
  }
}

export async function listTrafficJobs(
  filters: ListTrafficJobsFilters = {},
): Promise<ServiceResult<TrafficJobRow[]>> {
  try {
    const data = await listLocalTrafficJobs(filters);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Traffic jobs could not be listed.", details: error };
  }
}

export async function getTrafficJob(id: string): Promise<ServiceResult<TrafficJobRow | null>> {
  try {
    const data = await getLocalTrafficJob(id);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Traffic job could not be loaded.", details: error };
  }
}

export async function updateTrafficJobStatus(
  id: string,
  status: TrafficJobRow["status"],
  extra: { errorMessage?: string | null } = {},
): Promise<ServiceResult<TrafficJobRow>> {
  try {
    const data = await updateLocalTrafficJobStatus(id, status, extra);

    if (!data) {
      return { ok: false, error: "Traffic job not found." };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Traffic job status could not be updated.", details: error };
  }
}

export async function saveTrafficJobResult(
  id: string,
  result: TrafficJobResultPayload,
): Promise<ServiceResult<TrafficJobResultRow>> {
  try {
    const job = await getLocalTrafficJob(id);
    if (!job) return { ok: false, error: "Traffic job not found." };

    const data = await saveLocalTrafficJobResult(id, result);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Traffic job result could not be saved.", details: error };
  }
}

export async function getTrafficJobResult(
  id: string,
): Promise<ServiceResult<TrafficJobResultRow | null>> {
  try {
    const data = await getLocalTrafficJobResult(id);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Traffic job result could not be loaded.", details: error };
  }
}

// Compatibility exports for older MVP pages/routes. They use local storage and do not require Supabase.
export async function createTrafficQuoteRequest(input: {
  customerPhone: string;
  whatsappMessageId?: string;
  rawMessage: string;
  parsed: ParsedTrafficRequest;
  status: LegacyTrafficJobStatus;
  missingFields: string[];
}) {
  const created = await createTrafficJob({
    customerPhone: input.customerPhone,
    rawMessage: input.rawMessage,
    tckn: input.parsed.tckn,
    plate: input.parsed.plate,
    documentSerial: input.parsed.documentSerial ?? input.parsed.documentSerialNo,
    birthDate: input.parsed.birthDate,
    source: "whatsapp",
    status: input.missingFields.length > 0 ? "failed" : "pending",
  });

  if (!created.ok) throw new Error(created.error);
  return { id: created.data.id };
}

export async function recordWhatsAppMessage(_input?: {
  customerPhone: string;
  whatsappMessageId?: string | null;
  direction: "incoming" | "outgoing";
  body: string;
  status?: string | null;
  requestId?: string | null;
}) {
  return;
}

export async function getNextJobForWorker(): Promise<WorkerJob | null> {
  const listed = await listLocalTrafficJobs({ status: "pending", limit: 1 });
  const job = listed.sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];

  if (!job?.tckn || !job.plate || !job.documentSerial || !job.birthDate) return null;

  return {
    id: job.id,
    customer_phone: job.customerPhone,
    tckn: job.tckn,
    plate: job.plate,
    document_serial_no: job.documentSerial,
    birth_date: job.birthDate,
    status: "pending",
  };
}

export async function markJobRunning(id: string) {
  const updated = await updateTrafficJobStatus(id, "running");
  if (!updated.ok) throw new Error(updated.error);
}

export async function saveJobResult(input: {
  requestId: string;
  result: TrafficQuoteResult;
  status?: LegacyTrafficJobStatus;
}) {
  const saved = await saveTrafficJobResult(input.requestId, {
    quotes: [
      {
        company: input.result.cheapestCompany,
        premium: input.result.cheapestPrice,
        currency: "TRY",
        description: "Legacy quote result",
      },
    ],
    cheapestPremium: input.result.cheapestPrice,
    highestPremium: input.result.highestPrice ?? input.result.cheapestPrice,
    summary: "Legacy quote result",
  });

  if (!saved.ok) throw new Error(saved.error);
  await updateTrafficJobStatus(input.requestId, "completed");
}

export async function markJobFailed(id: string, errorMessage: string) {
  const updated = await updateTrafficJobStatus(id, "failed", { errorMessage });
  if (!updated.ok) throw new Error(updated.error);
}

export async function listDashboardData(): Promise<DashboardData> {
  const jobs = await listLocalTrafficJobs({ limit: 50 });
  const requests = jobs.map<DashboardRequestRow>((job) => ({
    id: job.id,
    customer_phone: job.customerPhone,
    plate: job.plate ?? null,
    status: mapLocalStatusToLegacy(job.status),
    created_at: job.createdAt,
  }));

  return {
    requests,
    resultsByRequest: new Map(),
    totalCount: requests.length,
  };
}

export async function listRecentJobs() {
  return listLocalTrafficJobs({ limit: 50 });
}

function mapLocalStatusToLegacy(status: TrafficJobRow["status"]): LegacyTrafficJobStatus {
  if (status === "completed") return "parsed";
  if (status === "running") return "running_doganium";
  if (status === "failed") return "failed";
  if (status === "waiting_mfa") return "manual_review";
  return "pending";
}
