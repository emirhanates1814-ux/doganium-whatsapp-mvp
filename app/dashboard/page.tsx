import {
  getTrafficJobResult,
  listTrafficJobs,
  type TrafficJobResultRow,
  type TrafficJobRow,
} from "@/lib/traffic-jobs";
import DashboardClient, { type DashboardJob } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await listTrafficJobs({ limit: 50 });

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Veriler yüklenemedi.</p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">
            Yerel trafik job kayıtları okunamadı
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            `.data` klasörü erişimini, yerel store dosyalarını ve ortam değişkenlerini kontrol edin.
          </p>
        </section>
      </main>
    );
  }

  const jobs = await withResults(result.data);

  return <DashboardClient jobs={jobs} />;
}

async function withResults(jobs: TrafficJobRow[]): Promise<DashboardJob[]> {
  const results = await Promise.all(
    jobs.map(async (job) => {
      const result = await getTrafficJobResult(job.id);
      return result.ok ? result.data : null;
    }),
  );

  return jobs.map((job, index) => ({
    ...job,
    result: normalizeResult(results[index]),
  }));
}

function normalizeResult(result: TrafficJobResultRow | null): DashboardJob["result"] {
  if (!result) return null;

  return {
    jobId: result.jobId,
    quotes: result.quotes,
    cheapestPremium: result.cheapestPremium ?? null,
    highestPremium: result.highestPremium ?? null,
    summary: result.summary ?? null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}
