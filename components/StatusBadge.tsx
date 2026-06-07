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
  failed: "Hata",
};

const statusClassName: Record<TrafficJobStatus, string> = {
  pending: "bg-slate-100 text-slate-700 ring-slate-200",
  missing_fields: "bg-orange-50 text-orange-700 ring-orange-200",
  ready_for_worker: "bg-blue-50 text-blue-700 ring-blue-200",
  running_doganium: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  pdf_downloaded: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  parsed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sent_to_customer: "bg-green-100 text-green-900 ring-green-300",
  manual_review: "bg-orange-50 text-orange-700 ring-orange-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status }: { status: TrafficJobStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[status]}`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}
