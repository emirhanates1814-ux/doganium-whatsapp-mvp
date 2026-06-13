import { listTrafficJobs, type TrafficJobRow } from "@/lib/traffic-jobs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await listTrafficJobs({ limit: 50 });

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-red-700">Veriler yüklenemedi.</h1>
          <p className="mt-3 text-sm text-slate-600">
            Yerel trafik job dosyaları okunamadı. .data klasörü erişimini kontrol edin.
          </p>
        </section>
      </main>
    );
  }

  const jobs = result.data;
  const summary = buildSummary(jobs);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Ares Sigorta</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Trafik Teklif Job Dashboard
            </h1>
          </div>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Yenile
          </a>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Toplam" value={summary.total} />
          <SummaryCard label="Pending" value={summary.pending} />
          <SummaryCard label="Running" value={summary.running} />
          <SummaryCard label="Completed" value={summary.completed} />
          <SummaryCard label="Failed" value={summary.failed} />
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold">Son Job Kayıtları</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Henüz trafik job kaydı yok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Tarih</th>
                    <th className="px-6 py-3">Müşteri telefonu</th>
                    <th className="px-6 py-3">Plaka</th>
                    <th className="px-6 py-3">Maskeli TCKN</th>
                    <th className="px-6 py-3">Durum</th>
                    <th className="px-6 py-3">Kaynak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                        {job.customerPhone}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                        {job.plate ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                        {maskTckn(job.tckn)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusPill status={job.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                        {job.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: TrafficJobRow["status"] }) {
  const className =
    status === "completed"
      ? "bg-green-100 text-green-800"
      : status === "running"
        ? "bg-blue-100 text-blue-800"
        : status === "failed"
          ? "bg-red-100 text-red-800"
          : status === "waiting_mfa"
            ? "bg-amber-100 text-amber-900"
            : status === "cancelled"
              ? "bg-slate-200 text-slate-700"
              : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function buildSummary(jobs: TrafficJobRow[]) {
  return jobs.reduce(
    (summary, job) => {
      summary.total += 1;
      if (job.status === "pending") summary.pending += 1;
      if (job.status === "running") summary.running += 1;
      if (job.status === "completed") summary.completed += 1;
      if (job.status === "failed") summary.failed += 1;
      return summary;
    },
    { total: 0, pending: 0, running: 0, completed: 0, failed: 0 },
  );
}

function maskTckn(value: string | undefined) {
  if (!value || value.length < 4) return "-";
  return `${value.slice(0, 3)}******${value.slice(-2)}`;
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
