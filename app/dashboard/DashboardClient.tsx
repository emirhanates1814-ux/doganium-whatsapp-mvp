"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  CheckCircle2,
  Clock3,
  Cpu,
  FileText,
  Hourglass,
  Inbox,
  List,
  MessageCircle,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
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

type CreatedTestJobState = {
  id: string;
  plate: string;
  status: TrafficJobRow["status"];
  createdAt?: string;
  nextStep: string;
};

type NewTrafficJobFormState = {
  customerPhone: string;
  plate: string;
  tckn: string;
  documentSerial: string;
  birthDate: string;
  rawMessage: string;
};

type ManualQuoteFormState = {
  company: string;
  premium: string;
  currency: string;
  pdfPath: string;
  note: string;
  markCompleted: boolean;
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

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function DashboardClient({ jobs }: { jobs: DashboardJob[] }) {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [createdTestJob, setCreatedTestJob] = useState<CreatedTestJobState | null>(null);
  const [createJobError, setCreateJobError] = useState<string | null>(null);
  const [creatingTestJob, setCreatingTestJob] = useState(false);
  const [newJob, setNewJob] = useState<NewTrafficJobFormState>({
    customerPhone: "",
    plate: "",
    tckn: "",
    documentSerial: "",
    birthDate: "",
    rawMessage: "",
  });
  const [createdManualJob, setCreatedManualJob] = useState<CreatedTestJobState | null>(null);
  const [manualJobError, setManualJobError] = useState<string | null>(null);
  const [creatingManualJob, setCreatingManualJob] = useState(false);
  const selectedJob = selectedJobId ? jobs.find((job) => job.id === selectedJobId) ?? null : null;
  const summary = useMemo(() => buildSummary(jobs), [jobs]);
  const openJobDetail = (jobId: string) => {
    setSelectedJobId(jobId);
  };
  const closeJobDetail = () => {
    setSelectedJobId(null);
  };
  const createMvpTestJob = async () => {
    setCreatingTestJob(true);
    setCreateJobError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: "905367074329",
          customerName: "MVP Test Musterisi",
          tckn: "27136769618",
          plate: "34MYZ039",
          documentSerial: "HV689268",
          birthDate: "25.02.2000",
          rawMessage: "TC 27136769618 Plaka 34MYZ039 Belge HV689268 Dogum 25.02.2000",
        }),
      });
      const result = await response.json() as { ok?: boolean; data?: DashboardJob; error?: string };

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "Test işi oluşturulamadı.");
      }

      setCreatedTestJob({
        id: result.data.id,
        plate: result.data.plate ?? "34MYZ039",
        status: result.data.status,
        createdAt: result.data.createdAt,
        nextStep: "Mock Worker Çalıştır komutunu çalıştırın, sonra dashboard'u yenileyip sonucu görüntüleyin.",
      });
      router.refresh();
    } catch (error) {
      setCreateJobError(error instanceof Error ? error.message : String(error));
    } finally {
      setCreatingTestJob(false);
    }
  };
  const createManualTrafficJob = async () => {
    setCreatingManualJob(true);
    setManualJobError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      const result = await response.json() as { ok?: boolean; data?: DashboardJob; error?: string };

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "Trafik işi oluşturulamadı.");
      }

      setCreatedManualJob({
        id: result.data.id,
        plate: result.data.plate ?? newJob.plate,
        status: result.data.status,
        createdAt: result.data.createdAt,
        nextStep: "İşi seçip Manuel Teklif Ekle bölümünden teklif sonucunu girin.",
      });
      setNewJob({
        customerPhone: "",
        plate: "",
        tckn: "",
        documentSerial: "",
        birthDate: "",
        rawMessage: "",
      });
      router.refresh();
    } catch (error) {
      setManualJobError(error instanceof Error ? error.message : String(error));
    } finally {
      setCreatingManualJob(false);
    }
  };

  return (
    <AppShell
      active="dashboard"
      title="Operasyon Paneli"
      description="Ares Sigorta trafik teklif işlerini, yerel kuyruğu, mock/manuel sonuç akışını ve MFA güvenli Doganium hazırlığını tek ekrandan yönetin."
      badge="Local Desktop Mode"
      actions={
        <Button asChild variant="outline" size="lg" className="rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
          <a href="/dashboard">
            <RefreshCcw className="mr-2 size-4" />
            Yenile
          </a>
        </Button>
      }
    >
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: easeOut }}
        className="grid min-w-0 grid-cols-12 gap-4"
      >
        <Card className="ares-panel-strong relative col-span-12 min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/25 xl:col-span-9">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-300/12 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
          <CardHeader className="relative gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/15 bg-white/[0.08] text-white shadow-sm hover:bg-white/[0.12]">
                <ShieldCheck className="mr-1 size-3.5" />
                Yerel operasyon
              </Badge>
              <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-100 shadow-sm hover:bg-emerald-400/14">
                <Sparkles className="mr-1 size-3.5" />
                Mock/manuel sonuç akışı hazır
              </Badge>
            </div>
            <div>
              <CardTitle className="ares-title text-3xl font-black lg:text-4xl">
                Trafik Teklif MVP Operasyonu
              </CardTitle>
              <CardDescription className="ares-muted mt-2 max-w-3xl text-sm leading-6">
                Bekleyen işleri izleyin, local queue durumunu takip edin ve Doganium MFA gerekiyorsa
                manuel doğrulama adımıyla mock/manuel sonuç akışını sürdürün.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Listelenen iş" value={summary.total} />
              <HeroMetric label="Tamamlanan" value={summary.completed} />
              <HeroMetric label="Aksiyon bekleyen" value={summary.pending + summary.waiting_mfa} />
            </div>
          </CardHeader>
        </Card>

        <Card className="ares-panel col-span-12 min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/15 xl:col-span-3">
          <CardHeader className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-amber-100">
                  Manuel doğrulama gerekli olabilir
                </CardTitle>
                <CardDescription className="mt-1 text-sm leading-6 text-amber-200/80">
                  MFA/authenticator görülürse doğrulama operatör tarafından yapılır; tam otomatik PDF alma sonraki fazdır.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.section>

      <OperationFlow summary={summary} />

      <MvpReadinessPanel
        createdTestJob={createdTestJob}
        createJobError={createJobError}
        creatingTestJob={creatingTestJob}
        onCreateTestJob={createMvpTestJob}
      />

      <NewTrafficJobPanel
        form={newJob}
        createdJob={createdManualJob}
        error={manualJobError}
        submitting={creatingManualJob}
        onChange={setNewJob}
        onSubmit={createManualTrafficJob}
      />

      <section className="grid min-w-0 grid-cols-12 gap-3">
        <SummaryCard label="Toplam İş" value={summary.total} tone="navy" helper="Son 50 kayıt" icon={FileText} index={0} />
        <SummaryCard label="Bekleyen" value={summary.pending} tone="orange" helper="Kuyrukta" icon={Clock3} index={1} />
        <SummaryCard label="Çalışan" value={summary.running} tone="blue" helper="Worker işliyor" icon={PlayCircle} index={2} />
        <SummaryCard label="Tamamlanan" value={summary.completed} tone="green" helper="Sonuç hazır" icon={CheckCircle2} index={3} />
        <SummaryCard label="Hatalı" value={summary.failed} tone="red" helper="Kontrol gerekli" icon={AlertTriangle} index={4} />
        <SummaryCard label="MFA Bekleyen" value={summary.waiting_mfa} tone="amber" helper="Manuel adım" icon={Hourglass} index={5} />
      </section>

      <SystemStatusPanel />

      <section className="min-w-0">
        <RecentJobsTable
          jobs={jobs}
          selectedJobId={selectedJob?.id ?? null}
          onSelectJob={openJobDetail}
        />
      </section>

      {!selectedJob ? <NoSelectedJobHint hasJobs={jobs.length > 0} /> : null}

      <JobDetailDrawer job={selectedJob} onClose={closeJobDetail} />
    </AppShell>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="ares-surface rounded-2xl p-3">
      <p className="text-xs font-semibold uppercase text-emerald-50/70">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function OperationFlow({ summary }: { summary: Summary }) {
  const stages = [
    { label: "Gelen İş", count: summary.total, icon: Inbox, active: true },
    { label: "Kuyruk", count: summary.pending, icon: List, active: summary.pending > 0 },
    { label: "Yarı otomatik hazırlık", count: summary.running + summary.waiting_mfa, icon: Cpu, active: summary.running + summary.waiting_mfa > 0, processing: summary.running > 0 },
    { label: "Mock/manuel sonuç", count: summary.completed, icon: FileText, active: summary.completed > 0 },
    { label: "WhatsApp", count: 0, icon: MessageCircle, active: false },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: 0.06, ease: easeOut }}
      className="ares-panel relative overflow-hidden rounded-3xl p-4 shadow-2xl shadow-black/20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.16),transparent_30%)]" />
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Canlı İş Akışı</p>
          <p className="ares-muted mt-1 text-sm">WhatsApp talebinden mock/manuel teklif sonucuna kadar yerel operasyon hattı.</p>
        </div>
        <Badge variant="outline" className="border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
          Ares Operasyon Hattı
        </Badge>
      </div>

      <div className="relative grid gap-2.5 lg:grid-cols-5">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="relative min-w-0">
              <div
                className={[
                  "relative z-10 min-h-[112px] rounded-2xl border p-3.5 transition-colors",
                  stage.processing
                    ? "border-emerald-400/28 bg-emerald-400/10"
                    : stage.active
                      ? "border-white/12 bg-white/[0.065]"
                      : "border-white/[0.08] bg-white/[0.035]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={[
                      "flex size-9 items-center justify-center rounded-xl border",
                      stage.processing
                        ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                        : stage.active
                          ? "border-white/12 bg-white/[0.06] text-slate-100"
                          : "border-white/[0.08] bg-white/[0.035] text-slate-500",
                    ].join(" ")}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-xs font-semibold text-slate-200">
                    {stage.count}
                  </span>
                </div>
                <p className={stage.processing ? "mt-3 text-sm font-bold text-emerald-300" : "mt-3 text-sm font-bold text-slate-200"}>
                  {stage.label}
                </p>
                <p className="ares-muted mt-1 text-xs">
                  {stage.processing ? "İşleniyor" : stage.active ? "Aktif" : "Beklemede"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function MvpReadinessPanel({
  createdTestJob,
  createJobError,
  creatingTestJob,
  onCreateTestJob,
}: {
  createdTestJob: CreatedTestJobState | null;
  createJobError: string | null;
  creatingTestJob: boolean;
  onCreateTestJob: () => void;
}) {
  const statusItems = [
    { label: "Local queue", value: "Aktif", detail: "Yerel iş kuyruğu MVP akışını taşır.", tone: "green" },
    { label: "Mock/manuel quote flow", value: "Aktif", detail: "Mock/manuel sonuç akışı hazır.", tone: "green" },
    { label: "Doganium full automation", value: "Sonraki faz", detail: "Tam otomatik PDF alma Phase 2 kapsamındadır.", tone: "amber" },
    { label: "MFA/manual verification", value: "Beklenen dış adım", detail: "MFA ekranında manuel doğrulama gerekli.", tone: "blue" },
  ] as const;

  const checklist = [
    "İş kuyruğu",
    "Sonuç görüntüleme",
    "Ayarlar",
    "Loglar",
    "Doganium bağlantı kontrolü",
    "EXE paketleme",
  ];

  return (
    <section className="grid min-w-0 grid-cols-12 gap-4">
      <Card className="ares-panel col-span-12 min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/18 xl:col-span-7">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="ares-title text-base font-black">MVP Durumu</CardTitle>
          <CardDescription className="ares-muted text-sm">
            Doganium tam otomasyonu MVP için bloklayıcı değildir; MFA görülürse manuel doğrulama ile mock/manuel mod devam eder.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 p-4 pt-0 md:grid-cols-4">
          {statusItems.map((item) => (
            <div key={item.label} className="ares-surface min-w-0 rounded-2xl p-3 shadow-md shadow-black/10">
              <p className="ares-muted truncate text-xs font-bold uppercase">{item.label}</p>
              <div className="mt-2">
                <SoftBadge tone={item.tone}>{item.value}</SoftBadge>
              </div>
              <p className="ares-muted mt-2 text-xs leading-5">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="ares-panel col-span-12 min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/18 xl:col-span-5">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="ares-title text-base font-black">MVP Lokal Test Akışı</CardTitle>
          <CardDescription className="ares-muted text-sm">Test işi oluşturun, mock worker komutunu çalıştırın, sonucu dashboard'da görüntüleyin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <Button
            type="button"
            onClick={onCreateTestJob}
            disabled={creatingTestJob}
            className="h-11 w-full rounded-2xl bg-emerald-500 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400"
          >
            {creatingTestJob ? "Test işi oluşturuluyor..." : "MVP Test İşi Oluştur"}
          </Button>

          {createdTestJob ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-emerald-100">Test işi oluşturuldu</p>
                <SoftBadge tone="green">{getStatusLabel(createdTestJob.status)}</SoftBadge>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-slate-200">
                <div className="flex min-w-0 justify-between gap-3">
                  <dt className="text-slate-400">Job ID</dt>
                  <dd className="truncate font-mono">{createdTestJob.id}</dd>
                </div>
                <div className="flex min-w-0 justify-between gap-3">
                  <dt className="text-slate-400">Plaka</dt>
                  <dd className="font-bold">{createdTestJob.plate}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-5 text-emerald-50/80">{createdTestJob.nextStep}</p>
            </div>
          ) : null}

          {createJobError ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100">
              {createJobError}
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mock Worker Çalıştır</p>
            <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-xl bg-black/30 px-3 py-2 text-xs text-emerald-100">
              python .\worker\mock_doganium_worker.py
            </code>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">MVP Checklist</p>
            {checklist.map((item) => (
              <div key={item} className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-300" />
                <span className="truncate text-sm font-semibold text-slate-100">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function NewTrafficJobPanel({
  form,
  createdJob,
  error,
  submitting,
  onChange,
  onSubmit,
}: {
  form: NewTrafficJobFormState;
  createdJob: CreatedTestJobState | null;
  error: string | null;
  submitting: boolean;
  onChange: (value: NewTrafficJobFormState) => void;
  onSubmit: () => void;
}) {
  const update = (field: keyof NewTrafficJobFormState, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Card className="ares-panel min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/18">
      <CardHeader className="border-b border-[var(--ares-border)] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="ares-title text-lg font-black">Yeni Trafik İşi</CardTitle>
            <CardDescription className="ares-muted text-sm">
              Gerçek MVP akışı için yerel kuyruğa manuel trafik teklif işi ekleyin.
            </CardDescription>
          </div>
          <SoftBadge tone="green">Local queue</SoftBadge>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-5 lg:grid-cols-12">
        <div className="grid min-w-0 gap-3 lg:col-span-8 md:grid-cols-2">
          <FormField label="Telefon" value={form.customerPhone} onChange={(value) => update("customerPhone", value)} placeholder="905xxxxxxxxx" />
          <FormField label="Plaka" value={form.plate} onChange={(value) => update("plate", value.toUpperCase())} placeholder="34ABC123" />
          <FormField label="TCKN" value={form.tckn} onChange={(value) => update("tckn", value)} placeholder="11 hane" />
          <FormField label="Belge seri no" value={form.documentSerial} onChange={(value) => update("documentSerial", value.toUpperCase())} placeholder="HV689268" />
          <FormField label="Doğum tarihi" value={form.birthDate} onChange={(value) => update("birthDate", value)} placeholder="25.02.2000" />
          <div className="min-w-0 md:col-span-2">
            <label className="ares-muted block text-sm font-bold">Ham mesaj / not</label>
            <textarea
              value={form.rawMessage}
              onChange={(event) => update("rawMessage", event.target.value)}
              className="ares-input mt-2 min-h-24 w-full rounded-xl px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--ares-green)] focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Müşteri mesajı veya operatör notu"
            />
          </div>
        </div>

        <div className="grid content-start gap-3 lg:col-span-4">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="h-11 rounded-2xl bg-emerald-500 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400"
          >
            {submitting ? "İş oluşturuluyor..." : "Yeni Trafik İşi Oluştur"}
          </Button>

          {createdJob ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-emerald-100">İş oluşturuldu</p>
                <SoftBadge tone="green">{getStatusLabel(createdJob.status)}</SoftBadge>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-slate-200">
                <InfoRow label="Job ID" value={createdJob.id} monospace />
                <InfoRow label="Plaka" value={createdJob.plate} />
                <InfoRow label="Durum" value={getStatusLabel(createdJob.status)} />
                <InfoRow label="Oluşturma" value={createdJob.createdAt ? formatDate(createdJob.createdAt) : "-"} />
              </dl>
              <p className="mt-3 text-xs leading-5 text-emerald-50/80">{createdJob.nextStep}</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100">
              {error}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  helper,
  icon: Icon,
  index,
}: {
  label: string;
  value: number;
  tone: "navy" | "green" | "orange" | "red" | "amber" | "blue";
  helper: string;
  icon: ComponentType<{ className?: string }>;
  index: number;
}) {
  const toneClass = {
    navy: "text-slate-100 border-slate-500/20 bg-slate-400/10",
    green: "text-emerald-300 border-emerald-500/20 bg-emerald-400/10",
    orange: "text-orange-300 border-orange-500/20 bg-orange-400/10",
    red: "text-rose-300 border-rose-500/20 bg-rose-400/10",
    amber: "text-amber-300 border-amber-500/20 bg-amber-400/10",
    blue: "text-sky-300 border-sky-500/20 bg-sky-400/10",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.17, delay: 0.03 + index * 0.02, ease: easeOut }}
      className="col-span-6 min-w-0 md:col-span-4 xl:col-span-2"
    >
      <Card className={`ares-surface group relative overflow-hidden rounded-xl shadow-xl shadow-black/15 transition-colors hover:bg-white/[0.075] ${toneClass}`}>
        <div className={`absolute -right-6 -top-6 size-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-35 ${toneClass}`} />
        <CardContent className="relative z-10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-100">{value}</p>
            </div>
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
              <Icon className="size-5" />
            </span>
          </div>
          <p className="mt-2 truncate text-[10px] font-medium uppercase text-slate-500">{helper}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SystemStatusPanel() {
  const statuses = [
    { label: "Local Store", value: "Aktif", detail: "JSON varsayılan", tone: "green", icon: ShieldCheck },
    { label: "Prisma SQLite", value: "Opsiyonel", detail: "Worker bekliyor", tone: "neutral", icon: FileText },
    { label: "Doganium", value: "Yarı otomatik hazırlık", detail: "MFA manuel doğrulanır", tone: "orange", icon: AlertTriangle },
    { label: "Mock Worker", value: "Hazır", detail: "Mock/manuel sonuç akışı hazır", tone: "green", icon: BadgeCheck },
    { label: "WhatsApp", value: "Local test", detail: "Webhook yok", tone: "blue", icon: Car },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.1, ease: easeOut }}>
      <Card className="ares-panel rounded-3xl shadow-2xl shadow-black/18">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="ares-title text-base font-black">Sistem Durumu</CardTitle>
          <CardDescription className="ares-muted text-sm">
            Yerel otomasyon bileşenlerinin kısa operasyon özeti.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-5">
            {statuses.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15, delay: 0.12 + index * 0.02, ease: easeOut }}
                  className="ares-surface min-w-0 rounded-2xl p-3 shadow-md shadow-black/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="ares-muted truncate text-xs font-bold uppercase">{item.label}</p>
                    <Icon className="size-4 shrink-0 text-[var(--ares-green)]" />
                  </div>
                  <div className="mt-2">
                    <SoftBadge tone={item.tone}>{item.value}</SoftBadge>
                  </div>
                  <p className="ares-muted mt-2 truncate text-xs">{item.detail}</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.16, ease: easeOut }} className="min-w-0">
      <Card className="ares-panel min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/25 ring-1 ring-emerald-300/5">
        <CardHeader className="border-b border-[var(--ares-border)] bg-[rgba(7,21,33,0.46)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-100">İşlem Kuyruğu</CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Detay butonu seçili işi sağ taraftaki operasyon çekmecesinde açar.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-200 shadow-sm">
              {jobs.length} kayıt
            </Badge>
          </div>
        </CardHeader>
        <Separator />

        {jobs.length === 0 ? (
          <CardContent>
            <div className="grid gap-4 py-12 text-center">
              <div>
                <p className="text-base font-semibold text-slate-100">Henüz trafik teklif işi yok.</p>
                <p className="mt-2 text-sm text-slate-400">
                  Yerel JSON akışını test etmek için önce test job oluşturun, sonra mock worker çalıştırın.
                </p>
              </div>
              <div className="mx-auto grid max-w-2xl gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-left text-sm text-emerald-100">
                <code>powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\create-test-traffic-job.ps1"</code>
                <code>python ".\worker\mock_doganium_worker.py"</code>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-[rgba(7,21,33,0.92)]">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="h-12 w-[158px] px-5 text-xs font-bold uppercase tracking-wide text-slate-300">Tarih</TableHead>
                  <TableHead className="px-4 text-xs font-bold uppercase tracking-wide text-slate-300">Telefon</TableHead>
                  <TableHead className="w-[132px] px-4 text-xs font-bold uppercase tracking-wide text-slate-300">Plaka</TableHead>
                  <TableHead className="w-[142px] px-4 text-xs font-bold uppercase tracking-wide text-slate-300">TCKN</TableHead>
                  <TableHead className="w-[154px] px-4 text-xs font-bold uppercase tracking-wide text-slate-300">Durum</TableHead>
                  <TableHead className="w-[128px] px-5 text-right text-xs font-bold uppercase tracking-wide text-slate-300">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job, index) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.075)" }}
                    transition={{ duration: 0.14, delay: Math.min(index, 8) * 0.015, ease: easeOut }}
                    data-state={selectedJobId === job.id ? "selected" : undefined}
                    className="h-16 border-b border-white/[0.06] odd:bg-white/[0.025] even:bg-white/[0.045] transition-colors data-[state=selected]:bg-emerald-500/14 data-[state=selected]:shadow-[inset_4px_0_0_#10b981]"
                  >
                    <TableCell className="px-5 text-xs font-medium text-slate-400">{formatDate(job.createdAt)}</TableCell>
                    <TableCell className="truncate px-4 font-semibold text-slate-100">{job.customerPhone || "-"}</TableCell>
                    <TableCell className="px-4">
                      <span className="inline-flex max-w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold tracking-wide text-slate-100">
                        <span className="truncate">{job.plate ?? "-"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-xs text-slate-400">{maskTckn(job.tckn)}</TableCell>
                    <TableCell className="px-4"><StatusBadge status={job.status} /></TableCell>
                    <TableCell className="px-5 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl border-emerald-400/25 bg-emerald-400/10 px-4 text-xs font-bold text-emerald-100 shadow-sm hover:bg-emerald-400/16 hover:text-white"
                        onClick={() => onSelectJob(job.id)}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function JobDetailDrawer({ job, onClose }: { job: DashboardJob | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {job ? <JobDetailDrawerContent key={job.id} job={job} onClose={onClose} /> : null}
    </AnimatePresence>
  );
}

function NoSelectedJobHint({ hasJobs }: { hasJobs: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: easeOut }}
      className="ares-surface rounded-3xl p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-100">
            {hasJobs ? "İş detayını açmak için bir kayıt seçin." : "Test akışı için yerel job oluşturun."}
          </p>
          <p className="ares-muted mt-1 text-sm">
            {hasJobs
              ? "Detay çekmecesinde müşteri bilgileri, ham mesaj ve teklif sonuçları görüntülenir."
              : "Yerel JSON store ve mock worker ile Doganium erişimi olmadan demo akışını doğrulayabilirsiniz."}
          </p>
        </div>
        <div className="grid shrink-0 gap-1.5 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs text-emerald-100">
          <code>.\scripts\create-test-traffic-job.ps1</code>
          <code>python .\worker\mock_doganium_worker.py</code>
        </div>
      </div>
    </motion.div>
  );
}

function JobDetailDrawerContent({ job, onClose }: { job: DashboardJob; onClose: () => void }) {
  const router = useRouter();
  const [manualQuote, setManualQuote] = useState<ManualQuoteFormState>({
    company: "",
    premium: "",
    currency: "TRY",
    pdfPath: "",
    note: "",
    markCompleted: true,
  });
  const [manualQuoteError, setManualQuoteError] = useState<string | null>(null);
  const [manualQuoteSuccess, setManualQuoteSuccess] = useState<string | null>(null);
  const [savingManualQuote, setSavingManualQuote] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  if (!job) {
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18, ease: easeOut }}>
        <Card className="ares-panel rounded-2xl shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="ares-title text-lg font-bold">İş Detayı</CardTitle>
            <CardDescription className="ares-muted">Detayları görmek için tablodan bir iş seçin.</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  const cheapestPremium = getCheapestPremium(job.result);
  const highestPremium = getHighestPremium(job.result);
  const quoteCurrency = job.result?.quotes[0]?.currency ?? "TRY";
  const cheapestOffer = getCheapestOffer(job.result);
  const companyCount = job.result?.quotes.length ?? 0;
  const shortId = job.id.length > 12 ? `${job.id.slice(0, 8)}...${job.id.slice(-4)}` : job.id;
  const canPrepareWhatsapp = job.status === "completed" && !!cheapestOffer;
  const updateManualQuote = (field: keyof ManualQuoteFormState, value: string | boolean) => {
    setManualQuote((current) => ({ ...current, [field]: value }));
  };
  const saveManualQuote = async () => {
    setSavingManualQuote(true);
    setManualQuoteError(null);
    setManualQuoteSuccess(null);

    try {
      const premium = Number(manualQuote.premium.replace(",", "."));
      if (!manualQuote.company.trim()) throw new Error("Sigorta şirketi zorunludur.");
      if (!Number.isFinite(premium) || premium < 0) throw new Error("Prim tutarı geçerli bir sayı olmalıdır.");

      const existingQuotes = job.result?.quotes ?? [];
      const nextQuotes = [
        ...existingQuotes,
        {
          company: manualQuote.company.trim(),
          premium,
          currency: manualQuote.currency.trim() || "TRY",
          description: manualQuote.note.trim() || null,
          pdfPath: manualQuote.pdfPath.trim() || null,
          note: manualQuote.note.trim() || null,
        },
      ];
      const cheapest = Math.min(...nextQuotes.map((quote) => quote.premium));
      const highest = Math.max(...nextQuotes.map((quote) => quote.premium));
      const response = await fetch(`/api/jobs/${job.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotes: nextQuotes,
          cheapestPremium: cheapest,
          highestPremium: highest,
          summary: `${nextQuotes.length} manuel/mock teklif kaydı`,
          markCompleted: manualQuote.markCompleted,
        }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Manuel teklif kaydedilemedi.");
      }

      setManualQuote({
        company: "",
        premium: "",
        currency: "TRY",
        pdfPath: "",
        note: "",
        markCompleted: true,
      });
      setManualQuoteSuccess("Manuel teklif kaydedildi. Dashboard yenileniyor.");
      router.refresh();
    } catch (error) {
      setManualQuoteError(error instanceof Error ? error.message : String(error));
    } finally {
      setSavingManualQuote(false);
    }
  };
  const prepareWhatsappMessage = async () => {
    if (!cheapestOffer) return;
    const message = buildWhatsappMessage(cheapestOffer);
    setWhatsappMessage(message);
    try {
      await navigator.clipboard?.writeText(message);
    } catch {
      // Copy is best effort; the textarea still shows the message.
    }
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Detay panelini kapat"
        className="fixed inset-0 z-40 hidden bg-black/35 backdrop-blur-[2px] lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: easeOut }}
        onClick={onClose}
      />
      <motion.aside
        initial={{ opacity: 0, x: 34 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 34 }}
        transition={{ duration: 0.2, ease: easeOut }}
        className="fixed bottom-6 left-4 right-4 top-[88px] z-50 flex min-h-0 lg:left-auto lg:right-6 lg:w-[460px]"
        role="dialog"
        aria-modal="true"
        aria-label="Seçili iş detayları"
      >
      <Card className="ares-panel-strong flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-emerald-300/12 shadow-2xl shadow-black/35">
        <CardHeader className="shrink-0 border-b border-white/10 bg-[linear-gradient(135deg,#06111d,#102033_62%,#0b5f3f)] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-black text-white">Seçili İş</CardTitle>
                <StatusBadge status={job.status} />
              </div>
              <CardDescription className="mt-1 truncate text-xs text-emerald-50/75">
                {shortId}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <X className="size-4" />
              <span className="sr-only">Kapat</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[var(--ares-panel)] p-5">
          <section>
            <p className="mb-3 text-sm font-bold text-slate-100">Müşteri ve İş Bilgileri</p>
            <dl className="grid grid-cols-2 gap-2.5 text-sm">
              <DetailPill label="Telefon" value={job.customerPhone || "-"} span />
              <DetailPill label="Plaka" value={job.plate ?? "-"} />
              <DetailPill label="TCKN" value={maskTckn(job.tckn)} />
              <DetailPill label="Belge" value={job.documentSerial ?? "-"} />
              <DetailPill label="Doğum" value={job.birthDate ?? "-"} />
              <DetailPill label="Kaynak" value={sourceLabels[job.source] ?? job.source} span />
            </dl>
          </section>

          <Separator />

          <section>
            <p className="text-sm font-bold text-slate-100">Ham Mesaj</p>
            <ScrollArea className="ares-surface mt-2 h-28 rounded-2xl">
              <div className="p-4 text-sm leading-6 text-slate-300">{job.rawMessage || "Ham mesaj yok."}</div>
            </ScrollArea>
          </section>

          <Separator />

          <section>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-100">Teklif Sonuçları</p>
              {job.result?.summary ? <span className="text-xs font-medium text-slate-500">{job.result.summary}</span> : null}
            </div>

            {!job.result?.quotes.length ? (
              <div className="ares-surface mt-3 rounded-2xl p-4 text-sm text-slate-400">
                Bu iş için henüz teklif sonucu yok. Mock worker tamamlandığında teklifler burada görünecek.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm md:grid-cols-2">
                  <DetailPill label="En uygun teklif" value={cheapestOffer ? `${cheapestOffer.company} - ${formatCurrency(cheapestOffer.premium, cheapestOffer.currency)}` : "-"} />
                  <DetailPill label="En yüksek teklif" value={highestPremium === null ? "-" : formatCurrency(highestPremium, quoteCurrency)} />
                  <DetailPill label="Şirket sayısı" value={String(companyCount)} />
                  <div className="ares-surface min-w-0 rounded-2xl px-3.5 py-3">
                    <p className="text-xs font-medium text-slate-400">Durum</p>
                    <div className="mt-1">
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                </div>

                {job.result.quotes.map((quote, index) => {
                  const isCheapest = quote.premium === cheapestPremium;

                  return (
                    <motion.div
                      key={`${quote.company}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15, delay: index * 0.02, ease: easeOut }}
                    >
                      <Card
                        className={
                          isCheapest
                            ? "overflow-hidden rounded-2xl border-emerald-300/70 bg-emerald-400/12 shadow-lg shadow-emerald-950/18 ring-1 ring-emerald-300/20"
                            : "ares-surface rounded-2xl shadow-sm"
                        }
                      >
                        {isCheapest ? <div className="h-1.5 bg-gradient-to-r from-emerald-300 via-emerald-500 to-teal-400" /> : null}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-100">{quote.company}</p>
                              {quote.description ? <p className="mt-1 text-sm text-slate-400">{quote.description}</p> : null}
                              {quote.pdfPath ? <p className="mt-1 break-all text-xs text-slate-500">Dosya: {quote.pdfPath}</p> : null}
                              {quote.note && quote.note !== quote.description ? <p className="mt-1 text-xs text-slate-500">Not: {quote.note}</p> : null}
                            </div>
                            {isCheapest ? <SoftBadge tone="green">En uygun teklif</SoftBadge> : null}
                          </div>
                          <p className={isCheapest ? "mt-3 text-2xl font-black text-emerald-100" : "mt-3 text-2xl font-black text-slate-100"}>
                            {formatCurrency(quote.premium, quote.currency)}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <div>
              <p className="text-sm font-bold text-slate-100">Manuel Teklif Ekle</p>
              <p className="ares-muted mt-1 text-xs">Doganium/PDF otomasyonu beklemeden manuel veya mock teklif sonucu kaydedin.</p>
            </div>
            <div className="grid gap-3">
              <FormField label="Sigorta şirketi" value={manualQuote.company} onChange={(value) => updateManualQuote("company", value)} placeholder="Örn. QUICK" />
              <FormField label="Prim tutarı" value={manualQuote.premium} onChange={(value) => updateManualQuote("premium", value)} placeholder="12500" />
              <FormField label="Para birimi" value={manualQuote.currency} onChange={(value) => updateManualQuote("currency", value.toUpperCase())} placeholder="TRY" />
              <FormField label="PDF/dosya yolu" value={manualQuote.pdfPath} onChange={(value) => updateManualQuote("pdfPath", value)} placeholder="Opsiyonel" />
              <div className="min-w-0">
                <label className="ares-muted block text-sm font-bold">Not</label>
                <textarea
                  value={manualQuote.note}
                  onChange={(event) => updateManualQuote("note", event.target.value)}
                  className="ares-input mt-2 min-h-20 w-full rounded-xl px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--ares-green)] focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="Opsiyonel teklif notu"
                />
              </div>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={manualQuote.markCompleted}
                  onChange={(event) => updateManualQuote("markCompleted", event.target.checked)}
                  className="size-4 accent-emerald-500"
                />
                Kaydedince işi tamamlandı yap
              </label>
              <Button
                type="button"
                onClick={saveManualQuote}
                disabled={savingManualQuote}
                className="h-11 rounded-2xl bg-emerald-500 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400"
              >
                {savingManualQuote ? "Teklif kaydediliyor..." : "Manuel Teklif Kaydet"}
              </Button>
              {manualQuoteSuccess ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-100">{manualQuoteSuccess}</p> : null}
              {manualQuoteError ? <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm font-semibold text-rose-100">{manualQuoteError}</p> : null}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-100">WhatsApp Mesajı Hazırla</p>
                <p className="ares-muted mt-1 text-xs">Mesaj sadece hazırlanır; WhatsApp gönderimi yapılmaz.</p>
              </div>
              <SoftBadge tone={canPrepareWhatsapp ? "green" : "neutral"}>{canPrepareWhatsapp ? "Hazır" : "Sonuç bekliyor"}</SoftBadge>
            </div>
            <Button
              type="button"
              onClick={prepareWhatsappMessage}
              disabled={!canPrepareWhatsapp}
              variant="outline"
              className="h-10 w-full rounded-2xl border-emerald-400/25 bg-emerald-400/10 text-sm font-bold text-emerald-100 hover:bg-emerald-400/16 hover:text-white"
            >
              WhatsApp Mesajını Hazırla
            </Button>
            <textarea
              readOnly
              value={whatsappMessage}
              className="ares-input min-h-24 w-full rounded-xl px-3 py-3 text-sm leading-6 shadow-sm outline-none"
              placeholder="Tamamlanan iş için mesaj burada hazırlanır."
            />
          </section>
        </CardContent>
      </Card>
      </motion.aside>
    </>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="ares-muted block text-sm font-bold">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="ares-input mt-2 w-full min-w-0 rounded-xl px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--ares-green)] focus:ring-4 focus:ring-emerald-500/10"
      />
    </div>
  );
}

function InfoRow({ label, value, monospace = false }: { label: string; value: string; monospace?: boolean }) {
  return (
    <div className="flex min-w-0 justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className={monospace ? "truncate font-mono" : "truncate font-bold"}>{value}</dd>
    </div>
  );
}

function DetailPill({ label, value, span = false }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`ares-surface min-w-0 rounded-2xl px-3.5 py-3 ${span ? "col-span-2" : ""}`}>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-slate-100">{value}</dd>
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

  return <SoftBadge tone={tone}>{getStatusLabel(status)}</SoftBadge>;
}

function getStatusLabel(status: TrafficJobRow["status"]) {
  const labels: Record<TrafficJobRow["status"], string> = {
    pending: "Bekliyor",
    running: "Çalışıyor",
    waiting_mfa: "MFA Bekliyor",
    completed: "Tamamlandı",
    failed: "Hata",
    cancelled: "İptal",
  };

  return labels[status];
}

function SoftBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "green" | "orange" | "red" | "amber" | "blue";
}) {
  const className = {
    neutral: "border-white/10 bg-white/[0.08] text-slate-200",
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    orange: "border-orange-400/25 bg-orange-400/10 text-orange-200",
    red: "border-red-400/25 bg-red-400/10 text-red-200",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    blue: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  }[tone];

  return (
    <Badge variant="outline" className={`shrink-0 font-bold shadow-sm ${className}`}>
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

function getHighestPremium(result: DashboardJobResult | null) {
  if (!result?.quotes.length) return null;
  if (typeof result.highestPremium === "number") return result.highestPremium;
  return Math.max(...result.quotes.map((quote) => quote.premium));
}

function getCheapestOffer(result: DashboardJobResult | null) {
  if (!result?.quotes.length) return null;
  return result.quotes.reduce((best, quote) => (quote.premium < best.premium ? quote : best), result.quotes[0]);
}

function buildWhatsappMessage(quote: TrafficJobResultPayload["quotes"][number]) {
  return `Merhaba, trafik sigortası teklifiniz hazır. En uygun teklif: ${quote.company} - ${formatWhatsappPremium(quote.premium, quote.currency)}. Detay için bizimle iletişime geçebilirsiniz.`;
}

function formatWhatsappPremium(value: number, currency: string) {
  const amount = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
  return currency === "TRY" ? `${amount} TL` : `${amount} ${currency}`;
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
