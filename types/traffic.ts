export type TrafficJobStatus =
  | "pending"
  | "missing_fields"
  | "ready_for_worker"
  | "running_doganium"
  | "pdf_downloaded"
  | "parsed"
  | "sent_to_customer"
  | "manual_review"
  | "failed";

export type ParsedTrafficRequest = {
  tckn?: string;
  plate?: string;
  documentSerialNo?: string;
  birthDate?: string;
};

export type TrafficQuoteResult = {
  cheapestCompany: string;
  cheapestPrice: number;
  highestCompany?: string;
  highestPrice?: number;
  recommendedCompany?: string;
  recommendedPrice?: number;
  pdfUrl?: string;
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
