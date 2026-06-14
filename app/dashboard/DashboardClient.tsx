"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <Card className="rounded-lg border-slate-200 bg-white">
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-emerald-700">Ares Sigorta</p>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-800"
                  >
                    Local Desktop Mode
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Operasyon Paneli
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Günlük trafik teklif işleri, yerel job kuyruğu, mock sonuçlar ve durum takibi.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="lg" className="rounded-md">
                <a href="/dashboard">Yenile</a>
              </Button>
            </div>
            <Separator />
            <AppNavigation active="dashboard" />
          </CardHeader>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard label="Toplam İş" value={summary.total} tone="neutral" />
          <SummaryCard label="Bekleyen" value={summary.pending} tone="orange" />
          <SummaryCard label="Çalışan" value={summary.running} tone="blue" />
          <SummaryCard label="Tamamlanan" value={summary.completed} tone="green" />
          <SummaryCard label="Hatalı" value={summary.failed} tone="red" />
          <SummaryCard label="MFA Bekleyen" value={summary.waiting_mfa} tone="amber" />
        </section>

        <SystemStatusPanel />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
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

function AppNavigation({ active }: { active: "dashboard" | "desktop" }) {
  return (
    <nav className="flex flex-wrap gap-2">
      <NavButton href="/dashboard" active={active === "dashboard"}>
        Operasyon Paneli
      </NavButton>
      <NavButton href="/desktop" active={active === "desktop"}>
        Doganium Teknik Paneli
      </NavButton>
    </nav>
  );
}

function NavButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      asChild
      variant={active ? "default" : "outline"}
      size="lg"
      className="rounded-md"
    >
      <a href={href}>{children}</a>
    </Button>
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
    neutral: "text-slate-950",
    green: "text-emerald-800",
    orange: "text-orange-800",
    red: "text-red-800",
    amber: "text-amber-800",
    blue: "text-sky-800",
  }[tone];

  return (
    <Card className="rounded-lg border-slate-200 bg-white">
      <CardContent className="pt-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`mt-2 text-3xl font-bold tracking-tight ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
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
    <Card className="rounded-lg border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-950">Sistem Durumu</CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Yerel operasyon bileşenlerinin kısa özeti
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
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
    <Card className="rounded-lg border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-950">Son İşler</CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Yerel job kuyruğundaki son 50 kayıt
        </CardDescription>
      </CardHeader>
      <Separator />

      {jobs.length === 0 ? (
        <CardContent>
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-slate-700">Henüz trafik teklif işi yok.</p>
            <p className="mt-2 text-sm text-slate-500">
              Test job oluşturulduğunda kayıtlar burada listelenecek.
            </p>
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <Table className="min-w-[980px]">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Plaka</TableHead>
                <TableHead>TCKN</TableHead>
                <TableHead>Belge Seri</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kaynak</TableHead>
                <TableHead className="text-right">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  key={job.id}
                  data-state={selectedJobId === job.id ? "selected" : undefined}
                >
                  <TableCell className="text-slate-600">{formatDate(job.createdAt)}</TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {job.customerPhone || "-"}
                  </TableCell>
                  <TableCell className="text-slate-700">{job.plate ?? "-"}</TableCell>
                  <TableCell className="text-slate-700">{maskTckn(job.tckn)}</TableCell>
                  <TableCell className="text-slate-700">{job.documentSerial ?? "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {sourceLabels[job.source] ?? job.source}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={() => onSelectJob(job.id)}
                    >
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

function JobDetailPanel({ job }: { job: DashboardJob | null }) {
  if (!job) {
    return (
      <Card className="rounded-lg border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-950">İş Detayı</CardTitle>
          <CardDescription>Detayları görmek için tablodan bir iş seçin.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const cheapestPremium = getCheapestPremium(job.result);

  return (
    <Card className="rounded-lg border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-950">İş Detayı</CardTitle>
            <CardDescription className="mt-1 truncate text-xs">{job.id}</CardDescription>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="space-y-5 pt-0">
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <DetailRow label="Telefon" value={job.customerPhone || "-"} />
          <DetailRow label="Plaka" value={job.plate ?? "-"} />
          <DetailRow label="TCKN" value={maskTckn(job.tckn)} />
          <DetailRow label="Belge Seri" value={job.documentSerial ?? "-"} />
          <DetailRow label="Doğum Tarihi" value={job.birthDate ?? "-"} />
          <DetailRow label="Durum" value={statusLabels[job.status]} />
          <DetailRow label="Kaynak" value={sourceLabels[job.source] ?? job.source} />
        </dl>

        <Separator />

        <div>
          <p className="text-sm font-semibold text-slate-950">Ham Mesaj</p>
          <ScrollArea className="mt-2 h-28 rounded-md border border-slate-200 bg-slate-50">
            <div className="p-3 text-sm leading-6 text-slate-700">
              {job.rawMessage || "Ham mesaj yok."}
            </div>
          </ScrollArea>
        </div>

        <Separator />

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
                  <Card
                    key={`${quote.company}-${index}`}
                    className={
                      isCheapest
                        ? "rounded-lg border-emerald-300 bg-emerald-50"
                        : "rounded-lg border-slate-200 bg-white"
                    }
                  >
                    <CardContent className="pt-0">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
  children: ReactNode;
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
    <Badge variant="outline" className={className}>
      {children}
    </Badge>
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
