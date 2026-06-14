"use client";

import { useMemo, useState } from "react";
import type { TrafficJobResultPayload } from "@/types/traffic";
import type { TrafficJobRow } from "@/lib/traffic-jobs";

type DashboardJobResult = TrafficJobResultPayload & {
  jobId: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardJob = TrafficJobRow & {
  result: DashboardJobResult | null;
};

type Summary = {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  waiting_mfa: number;
};

const statusLabels: Record<TrafficJobRow["status"], string> = {
  pending: "Bekliyor",
  running: "Çalışıyor",
  waiting_mfa: "MFA Bekliyor",
  completed: "Tamamlandı",
  failed: "Hata",
  cancelled: "İptal",
};

const sourceLabels: Record<TrafficJobRow["source"], string> = {
  manual: "Manuel",
  whatsapp: "WhatsApp",
  test: "Test",
};

export default function DashboardClient({ jobs }: { jobs: DashboardJob[] }) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id ?? null);
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null;
  const summary = useMemo(() => buildSummary(jobs), [jobs]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-emerald-700">Ares Sigorta</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Local Desktop Mode
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Trafik Teklif Otomasyon Paneli
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Yerel job kuyruğu, mock sonuçlar ve Doganium hazırlık akışı
            </p>
          </div>
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Yenile
          </a>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard label="Toplam İş" value={summary.total} tone="neutral" />
          <SummaryCard label="Bekleyen" value={summary.pending} tone="orange" />
          <SummaryCard label="Çalışan" value={summary.running} tone="blue" />
          <SummaryCard label="Tamamlanan" value={summary.completed} tone="green" />
          <SummaryCard label="Hatalı" value={summary.failed} tone="red" />
          <SummaryCard label="MFA Bekleyen" value={summary.waiting_mfa} tone="amber" />
        </section>

        <SystemStatusPanel />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <RecentJobsTable
            jobs={jobs}
            selectedJobId={selectedJob?.id ?? null}
            onSelectJob={setSelectedJobId}
          />
          <JobDetailPanel job={selectedJob} />
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "green" | "orange" | "red" | "amber" | "blue";
}) {
  const toneClass = {
    neutral: "border-slate-200 text-slate-950",
    green: "border-emerald-200 text-emerald-800",
    orange: "border-orange-200 text-orange-800",
    red: "border-red-200 text-red-800",
    amber: "border-amber-200 text-amber-800",
    blue: "border-sky-200 text-sky-800",
  }[tone];

  return (
    <article className={`rounded-lg border bg-white p-4 shadow-sm ${toneClass}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </article>
  );
}

function SystemStatusPanel() {
  const statuses = [
    { label: "Local Store", value: "Aktif", tone: "green" },
    { label: "Doganium", value: "IP / erişim bekleniyor", tone: "orange" },
    { label: "Mock Worker", value: "Kullanılabilir", tone: "green" },
    { label: "WhatsApp Webhook", value: "Local test modu", tone: "blue" },
  ] as const;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Sistem Durumu</h2>
          <p className="mt-1 text-sm text-slate-500">Yerel operasyon bileşenlerinin kısa özeti</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
            <div className="mt-2">
              <SoftBadge tone={item.tone}>{item.value}</SoftBadge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentJobsTable({
  jobs,
  selectedJobId,
  onSelectJob,
}: {
  jobs: DashboardJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-slate-950">Son İşler</h2>
        <p className="mt-1 text-sm text-slate-500">Yerel job kuyruğundaki son 50 kayıt</p>
      </div>

      {jobs.length === 0 ? (
        <div className="px-4 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">Henüz trafik teklif işi yok.</p>
          <p className="mt-2 text-sm text-slate-500">
            Test job oluşturulduğunda kayıtlar burada listelenecek.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[980px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Plaka</th>
                <th className="px-4 py-3">TCKN</th>
                <th className="px-4 py-3">Belge Seri</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Kaynak</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className={selectedJobId === job.id ? "bg-slate-50" : "hover:bg-slate-50"}
                >
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">
                    {job.customerPhone || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                    {job.plate ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                    {maskTckn(job.tckn)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                    {job.documentSerial ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                    {sourceLabels[job.source] ?? job.source}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectJob(job.id)}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function JobDetailPanel({ job }: { job: DashboardJob | null }) {
  if (!job) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">İş Detayı</h2>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Detayları görmek için tablodan bir iş seçin.
        </p>
      </aside>
    );
  }

  const cheapestPremium = getCheapestPremium(job.result);

  return (
    <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">İş Detayı</h2>
            <p className="mt-1 text-sm text-slate-500">{job.id}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </div>

      <div className="space-y-5 p-5">
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <DetailRow label="Telefon" value={job.customerPhone || "-"} />
          <DetailRow label="Plaka" value={job.plate ?? "-"} />
          <DetailRow label="TCKN" value={maskTckn(job.tckn)} />
          <DetailRow label="Belge Seri" value={job.documentSerial ?? "-"} />
          <DetailRow label="Doğum Tarihi" value={job.birthDate ?? "-"} />
          <DetailRow label="Durum" value={statusLabels[job.status]} />
          <DetailRow label="Kaynak" value={sourceLabels[job.source] ?? job.source} />
        </dl>

        <div>
          <p className="text-sm font-semibold text-slate-950">Ham Mesaj</p>
          <div className="mt-2 max-h-32 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {job.rawMessage || "Ham mesaj yok."}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">Teklif Sonuçları</p>
            {job.result?.summary ? (
              <span className="text-xs font-medium text-slate-500">{job.result.summary}</span>
            ) : null}
          </div>

          {!job.result?.quotes.length ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Bu iş için henüz teklif sonucu yok.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {job.result.quotes.map((quote, index) => {
                const isCheapest = quote.premium === cheapestPremium;

                return (
                  <article
                    key={`${quote.company}-${index}`}
                    className={
                      isCheapest
                        ? "rounded-lg border border-emerald-300 bg-emerald-50 p-4"
                        : "rounded-lg border border-slate-200 bg-white p-4"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{quote.company}</p>
                        {quote.description ? (
                          <p className="mt-1 text-sm text-slate-600">{quote.description}</p>
                        ) : null}
                      </div>
                      {isCheapest ? <SoftBadge tone="green">En uygun</SoftBadge> : null}
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {formatCurrency(quote.premium, quote.currency)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: TrafficJobRow["status"] }) {
  const tone =
    status === "completed"
      ? "green"
      : status === "running"
        ? "blue"
        : status === "failed"
          ? "red"
          : status === "waiting_mfa"
            ? "amber"
            : status === "cancelled"
              ? "neutral"
              : "orange";

  return <SoftBadge tone={tone}>{statusLabels[status]}</SoftBadge>;
}

function SoftBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "neutral" | "green" | "orange" | "red" | "amber" | "blue";
}) {
  const className = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function buildSummary(jobs: DashboardJob[]): Summary {
  return jobs.reduce<Summary>(
    (summary, job) => {
      summary.total += 1;
      if (job.status === "pending") summary.pending += 1;
      if (job.status === "running") summary.running += 1;
      if (job.status === "completed") summary.completed += 1;
      if (job.status === "failed") summary.failed += 1;
      if (job.status === "waiting_mfa") summary.waiting_mfa += 1;
      return summary;
    },
    { total: 0, pending: 0, running: 0, completed: 0, failed: 0, waiting_mfa: 0 },
  );
}

function maskTckn(value: string | undefined) {
  if (!value || value.length < 4) return "-";
  return `${value.slice(0, 3)}******${value.slice(-2)}`;
}

function getCheapestPremium(result: DashboardJobResult | null) {
  if (!result?.quotes.length) return null;
  if (typeof result.cheapestPremium === "number") return result.cheapestPremium;
  return Math.min(...result.quotes.map((quote) => quote.premium));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(value: number, currency: string) {
  if (currency === "TRY") {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}
