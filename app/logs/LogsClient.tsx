"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ShieldCheck, TerminalSquare } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RuntimeLogLevel = "info" | "success" | "warning" | "error";

type RuntimeLogEvent = {
  id: string;
  ts: string;
  level: RuntimeLogLevel;
  source: string;
  jobId?: string;
  plate?: string;
  title: string;
  message: string;
};

const levelOptions: Array<{ value: "" | RuntimeLogLevel; label: string }> = [
  { value: "", label: "Tüm seviyeler" },
  { value: "info", label: "Info" },
  { value: "success", label: "Başarılı" },
  { value: "warning", label: "Uyarı" },
  { value: "error", label: "Hata" },
];

const sourceOptions = [
  "system",
  "whatsapp",
  "website",
  "dashboard",
  "doganium",
  "worker",
  "quote",
  "whatsapp_message",
] as const;

export default function LogsClient() {
  const [events, setEvents] = useState<RuntimeLogEvent[]>([]);
  const [level, setLevel] = useState<"" | RuntimeLogLevel>("");
  const [source, setSource] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [plateSearch, setPlateSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [pollError, setPollError] = useState(false);

  const loadLogs = async () => {
    try {
      const response = await fetch("/api/logs?limit=100", { cache: "no-store" });
      const result = await response.json() as { ok?: boolean; events?: RuntimeLogEvent[] };
      if (!response.ok || !result.ok || !Array.isArray(result.events)) {
        throw new Error("Log response is invalid.");
      }
      setEvents(result.events);
      setLastUpdated(new Date().toLocaleTimeString("tr-TR"));
      setPollError(false);
    } catch {
      setPollError(true);
    }
  };

  useEffect(() => {
    void loadLogs();
    const timer = window.setInterval(() => void loadLogs(), 1000);
    return () => window.clearInterval(timer);
    // The polling callback intentionally uses the same endpoint and fixed limit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedJobSearch = jobSearch.trim().toLocaleLowerCase("tr-TR");
    const normalizedPlateSearch = plateSearch.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return events.filter((event) => {
      if (level && event.level !== level) return false;
      if (source && event.source !== source) return false;
      if (
        normalizedJobSearch &&
        !(event.jobId ?? "").toLocaleLowerCase("tr-TR").includes(normalizedJobSearch)
      ) {
        return false;
      }
      if (
        normalizedPlateSearch &&
        !(event.plate ?? "")
          .replace(/[^A-Za-z0-9]/g, "")
          .toUpperCase()
          .includes(normalizedPlateSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [events, jobSearch, level, plateSearch, source]);

  return (
    <AppShell
      active="logs"
      title="Canlı Operasyon Logları"
      description="WhatsApp ve web taleplerinden yerel job, Doganium/MFA, teklif/PDF sonucu ve mesaj hazırlama adımlarına kadar operasyon akışı."
      badge="Local JSONL Stream"
      actions={
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
          onClick={() => void loadLogs()}
        >
          <RefreshCcw className="mr-2 size-4" />
          Yenile
        </Button>
      }
    >
      <section className="ares-panel-strong min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/25">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-100">
                <TerminalSquare className="mr-1 size-3.5" />
                En yeni önce
              </Badge>
              <Badge className="border-white/10 bg-white/[0.06] text-slate-200">
                {filteredEvents.length} / {events.length} olay
              </Badge>
            </div>
            <h2 className="ares-title mt-3 text-2xl font-black">Operasyon olay akışı</h2>
            <p className="ares-muted mt-2 text-sm">
              Son güncelleme: {lastUpdated || "Henüz alınmadı"}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100">
            <ShieldCheck className="size-4 shrink-0" />
            Gizli bilgiler loglanmaz.
          </div>
        </div>

        <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="min-w-0">
            <span className="ares-muted mb-1 block text-xs font-bold">Seviye</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as "" | RuntimeLogLevel)}
              className="ares-input h-10 w-full rounded-xl px-3 text-sm"
            >
              {levelOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className="ares-muted mb-1 block text-xs font-bold">Kaynak</span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="ares-input h-10 w-full rounded-xl px-3 text-sm"
            >
              <option value="">Tüm kaynaklar</option>
              {sourceOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className="ares-muted mb-1 block text-xs font-bold">Job ID ara</span>
            <input
              value={jobSearch}
              onChange={(event) => setJobSearch(event.target.value)}
              placeholder="Job ID"
              className="ares-input h-10 w-full rounded-xl px-3 text-sm"
            />
          </label>
          <label className="min-w-0">
            <span className="ares-muted mb-1 block text-xs font-bold">Plaka ara</span>
            <input
              value={plateSearch}
              onChange={(event) => setPlateSearch(event.target.value)}
              placeholder="34ABC123"
              className="ares-input h-10 w-full rounded-xl px-3 text-sm"
            />
          </label>
        </div>

        <div className="p-4">
          {pollError ? (
            <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Log servisine geçici olarak ulaşılamadı. Mevcut olaylar gösterilmeye devam ediyor.
            </p>
          ) : null}

          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center">
              <p className="font-bold text-slate-100">Henüz operasyon logu yok.</p>
              <p className="ares-muted mt-2 text-sm">
                Yeni bir talep, job veya teklif sonucu oluştuğunda olaylar burada görünür.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredEvents.map((event) => (
                <LogEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function LogEventCard({ event }: { event: RuntimeLogEvent }) {
  const tone = {
    info: "border-sky-400/20 bg-sky-400/[0.07]",
    success: "border-emerald-400/20 bg-emerald-400/[0.07]",
    warning: "border-amber-400/25 bg-amber-400/[0.08]",
    error: "border-rose-400/25 bg-rose-400/[0.08]",
  }[event.level];

  return (
    <Card className={`min-w-0 rounded-2xl ${tone}`}>
      <CardHeader className="gap-2 p-4 pb-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{formatTimestamp(event.ts)}</span>
          <Badge variant="outline" className="border-white/10 bg-slate-950/35 text-slate-100">
            {event.level}
          </Badge>
          <Badge variant="outline" className="border-white/10 bg-slate-950/35 text-slate-100">
            {event.source}
          </Badge>
          {event.plate ? (
            <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
              {event.plate}
            </Badge>
          ) : null}
        </div>
        <CardTitle className="break-words text-base font-black text-slate-100">
          {event.title}
        </CardTitle>
        <CardDescription className="break-words text-sm leading-6 text-slate-300">
          {event.message}
        </CardDescription>
      </CardHeader>
      {event.jobId ? (
        <CardContent className="p-4 pt-1">
          <p className="break-all font-mono text-xs text-slate-500">Job: {event.jobId}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
