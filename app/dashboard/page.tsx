import { SendOfferButton } from "@/components/SendOfferButton";
import { StatusBadge } from "@/components/StatusBadge";
import { listRecentJobs } from "@/lib/traffic-jobs";
import type { TrafficJobStatus } from "@/types/traffic";

export const dynamic = "force-dynamic";

type JobRow = Awaited<ReturnType<typeof listRecentJobs>>[number];

export default async function DashboardPage() {
  const jobs = await listRecentJobs();

  const summary = jobs.reduce(
    (acc, job) => {
      acc.total += 1;
      acc[job.status as keyof typeof acc] = Number(acc[job.status as keyof typeof acc] ?? 0) + 1;
      return acc;
    },
    { total: 0, ready_for_worker: 0, running_doganium: 0, parsed: 0, failed: 0 } as Record<string, number>
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Ares Sigorta</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Trafik Teklif Talepleri</h1>
            <p className="mt-2 text-slate-600">WhatsApp üzerinden gelen müşteri talepleri ve Doganium worker durumları.</p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Yenile
          </a>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <SummaryCard label="Toplam" value={summary.total ?? 0} />
          <SummaryCard label="Worker Hazır" value={summary.ready_for_worker ?? 0} />
          <SummaryCard label="Çalışıyor" value={summary.running_doganium ?? 0} />
          <SummaryCard label="Teklif Hazır" value={summary.parsed ?? 0} />
          <SummaryCard label="Hata" value={summary.failed ?? 0} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-950">Son Talepler</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {jobs.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">Henüz talep yok. WhatsApp webhook bağlandığında kayıtlar burada görünecek.</div>
            ) : (
              jobs.map((job) => <JobItem key={job.id} job={job as JobRow} />)
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function JobItem({ job }: { job: JobRow }) {
  const results = Array.isArray((job as any).traffic_quote_results) ? (job as any).traffic_quote_results : [];
  const latestResult = results[0];
  const status = job.status as TrafficJobStatus;

  return (
    <article className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-xs text-slate-500">{new Date(job.created_at).toLocaleString("tr-TR")}</span>
        </div>
        <div className="mt-3 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold text-slate-950">Telefon:</span> {job.customer_phone}</p>
          <p><span className="font-semibold text-slate-950">Plaka:</span> {job.plate ?? "-"}</p>
          <p><span className="font-semibold text-slate-950">TCKN:</span> {job.tckn_masked ?? "-"}</p>
          <p><span className="font-semibold text-slate-950">Belge:</span> {job.document_serial_no_masked ?? "-"}</p>
        </div>
        {job.error_message ? <p className="mt-2 text-sm text-red-600">{job.error_message}</p> : null}
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        {latestResult ? (
          <div>
            <p className="font-semibold text-slate-950">Teklif Özeti</p>
            <p className="mt-2">En uygun: {latestResult.cheapest_company} - {Number(latestResult.cheapest_price).toLocaleString("tr-TR")} TL</p>
            {latestResult.recommended_company ? (
              <p>Önerilen: {latestResult.recommended_company} - {Number(latestResult.recommended_price).toLocaleString("tr-TR")} TL</p>
            ) : null}
          </div>
        ) : (
          <p>Henüz teklif sonucu yok.</p>
        )}
      </div>

      <div className="flex justify-end">
        {status === "parsed" ? <SendOfferButton requestId={job.id} /> : null}
      </div>
    </article>
  );
}
