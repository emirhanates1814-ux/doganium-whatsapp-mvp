import type { TrafficJobStatus } from "@/types/traffic";

const statusLabel: Record<TrafficJobStatus, string> = {
  pending: "Bekliyor",
  missing_fields: "Eksik Bilgi",
  ready_for_worker: "Worker Hazır",
  running_doganium: "Doganium Çalışıyor",
  pdf_downloaded: "PDF İndi",
  parsed: "Teklif Hazır",
  sent_to_customer: "Gönderildi",
  manual_review: "Manuel Kontrol",
  failed: "Hata"
};

export function StatusBadge({ status }: { status: TrafficJobStatus }) {
  const className =
    status === "failed"
      ? "bg-red-50 text-red-700 ring-red-200"
      : status === "parsed" || status === "sent_to_customer"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : status === "missing_fields" || status === "manual_review"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${className}`}>
      {statusLabel[status] ?? status}
    </span>
  );
}
