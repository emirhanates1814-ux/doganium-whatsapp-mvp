import {
  getTrafficJobResult,
  listTrafficJobs,
  type TrafficJobResultRow,
  type TrafficJobRow,
} from "@/lib/traffic-jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardClient, { type DashboardJob } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await listTrafficJobs({ limit: 50 });

  if (!result.ok) {
    return (
      <main className="ares-shell min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <Card className="ares-panel mx-auto max-w-3xl rounded-3xl">
          <CardHeader>
            <p className="text-sm font-semibold text-red-300">Veriler yüklenemedi.</p>
            <CardTitle className="ares-title text-xl font-bold">
              Yerel trafik job kayıtları okunamadı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="ares-muted text-sm leading-6">
              `.data` klasörü erişimini, yerel store dosyalarını ve ortam değişkenlerini kontrol
              edin.
            </p>
          </CardContent>
        </Card>
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
