export type TrafficQuoteStatus =
  | "pending"
  | "missing_fields"
  | "ready_for_worker"
  | "running_doganium"
  | "pdf_downloaded"
  | "parsed"
  | "sent_to_customer"
  | "manual_review"
  | "failed";

export type TrafficRequestJobStatus =
  | "pending"
  | "running"
  | "waiting_mfa"
  | "completed"
  | "failed"
  | "cancelled";

export type TrafficJobSource = "whatsapp" | "website" | "manual" | "test";

export type LegacyTrafficJobStatus = TrafficQuoteStatus;
export type TrafficJobStatus = TrafficQuoteStatus;

export type ParsedTrafficRequest = {
  tckn?: string;
  plate?: string;
  documentSerial?: string;
  documentSerialNo?: string;
  birthDate?: string;
};

export type TrafficParseField = "tckn" | "plate" | "documentSerial" | "birthDate";

export type TrafficParseResult = {
  ok: boolean;
  data?: {
    tckn?: string;
    plate?: string;
    documentSerial?: string;
    birthDate?: string;
  };
  missingFields?: TrafficParseField[];
  errors?: string[];
};

export type TrafficQuoteResult = {
  cheapestCompany: string;
  cheapestPrice: number;
  highestCompany?: string;
  highestPrice?: number;
  recommendedCompany?: string;
  recommendedPrice?: number;
  pdfUrl?: string | null;
  raw?: unknown;
};

export type TrafficQuoteRequest = {
  id: string;
  customerPhone: string;
  customerName?: string | null;
  tcknMasked?: string | null;
  plate?: string | null;
  documentSerialNoMasked?: string | null;
  birthDateMasked?: string | null;
  status: TrafficJobStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrafficJobResultQuote = {
  company: string;
  premium: number;
  currency: "TRY" | string;
  description?: string | null;
  pdfPath?: string | null;
  note?: string | null;
};

export type TrafficJobResultPayload = {
  quotes: TrafficJobResultQuote[];
  cheapestPremium?: number | null;
  highestPremium?: number | null;
  summary?: string | null;
};
