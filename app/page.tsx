import { SendOfferButton } from "@/components/SendOfferButton";
import { StatusBadge } from "@/components/StatusBadge";
import { listDashboardData, type DashboardRequestRow, type DashboardResultRow } from "@/lib/traffic-jobs";

export const dynamic = "force-dynamic";

type Summary = {
  total: number;
  pending: number;
  parsed: number;
  failed: number;
};

export default async function HomePage() {
  try {
    const { requests, resultsByRequest, totalCount } = await listDashboardData();
    const summary = buildSummary(requests, totalCount);

    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Ares Sigorta</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Doganium WhatsApp MVP
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                WhatsApp üzerinden gelen trafik teklif talepleri ve Doganium işlem durumu.
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Yenile
            </a>
          </header>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Toplam Talep" value={summary.total} />
            <SummaryCard label="Bekleyen" value={summary.pending} />
            <SummaryCard label="Teklif Hazır" value={summary.parsed} />
            <SummaryCard label="Hatalı" value={summary.failed} />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="text-base font-semibold">Son 50 Talep</h2>
            </div>

            {requests.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Henüz trafik teklif talebi yok.
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Müşteri telefonu
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Plaka
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Durum
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Oluşturulma tarihi
                        </th>
                        <th scope="col" className="px-6 py-3">
                          En ucuz şirket
                        </th>
                        <th scope="col" className="px-6 py-3">
                          En ucuz fiyat
                        </th>
                        <th scope="col" className="px-6 py-3 text-right">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {requests.map((request) => (
                        <RequestTableRow
                          key={request.id}
                          request={request}
                          result={resultsByRequest.get(request.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {requests.map((request) => (
                    <RequestMobileCard
                      key={request.id}
                      request={request}
                      result={resultsByRequest.get(request.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    );
  } catch {
    return <DashboardError />;
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function RequestTableRow({
  request,
  result,
}: {
  request: DashboardRequestRow;
  result?: DashboardResultRow;
}) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
        {request.customer_phone}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
        {request.plate ?? "-"}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge status={request.status} />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
        {formatDate(request.created_at)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
        {result?.cheapest_company ?? "-"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
        {formatPrice(result?.cheapest_price)}
      </td>
      <td className="px-6 py-4 text-right">
        <ActionCell request={request} result={result} />
      </td>
    </tr>
  );
}

function RequestMobileCard({
  request,
  result,
}: {
  request: DashboardRequestRow;
  result?: DashboardResultRow;
}) {
  return (
    <article className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{request.customer_phone}</p>
          <p className="mt-1 text-sm text-slate-500">{formatDate(request.created_at)}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <InfoItem label="Plaka" value={request.plate ?? "-"} />
        <InfoItem label="En ucuz şirket" value={result?.cheapest_company ?? "-"} />
        <InfoItem label="En ucuz fiyat" value={formatPrice(result?.cheapest_price)} />
      </dl>

      <div className="flex justify-end">
        <ActionCell request={request} result={result} />
      </div>
    </article>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function ActionCell({
  request,
  result,
}: {
  request: DashboardRequestRow;
  result?: DashboardResultRow;
}) {
  if (request.status === "parsed" && result) {
    return <SendOfferButton requestId={request.id} />;
  }

  if (request.status === "sent_to_customer") {
    return <span className="text-sm font-medium text-green-800">Gönderildi</span>;
  }

  return <span className="text-sm text-slate-400">-</span>;
}

function DashboardError() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-red-700">Veriler yüklenemedi.</h1>
        <p className="mt-3 text-sm text-slate-600">
          Supabase bağlantısını ve tablo erişimini kontrol edin.
        </p>
      </section>
    </main>
  );
}

function buildSummary(requests: DashboardRequestRow[], totalCount: number): Summary {
  return requests.reduce<Summary>(
    (summary, request) => {
      if (request.status === "pending") summary.pending += 1;
      if (request.status === "parsed") summary.parsed += 1;
      if (request.status === "failed") summary.failed += 1;
      return summary;
    },
    {
      total: totalCount,
      pending: 0,
      parsed: 0,
      failed: 0,
    },
  );
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

function formatPrice(value: number | string | undefined) {
  if (value === undefined) {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(amount);
}
