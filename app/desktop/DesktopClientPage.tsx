"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FolderOpen,
  KeyRound,
  PlayCircle,
  Save,
  ShieldAlert,
  Terminal,
  Wifi,
  Wrench,
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
import { Separator } from "@/components/ui/separator";

interface DesktopSettings {
  doganiumExePath?: string;
  doganiumUsername?: string;
  doganiumPassword?: string;
  devtoolsPort?: number;
  devtoolsArgs?: string[];
  settingsReadError?: string;
}

interface DesktopResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: string;
}

interface DesktopApi {
  ping: () => Promise<DesktopResult>;
  readSettings: () => Promise<DesktopResult<DesktopSettings>>;
  writeSettings: (settings: DesktopSettings) => Promise<DesktopResult<DesktopSettings>>;
  selectDoganiumExe: () => Promise<DesktopResult<{ exePath: string; settings: DesktopSettings }>>;
  testDoganiumPath: (exePath?: string) => Promise<DesktopResult>;
  startDoganium: (exePath?: string) => Promise<DesktopResult>;
  checkDevTools: () => Promise<DesktopResult>;
  startLogin: () => Promise<DesktopResult>;
}

declare global {
  interface Window {
    desktopApi?: DesktopApi;
  }
}

const easeOut = [0.16, 1, 0.3, 1] as const;

function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitive);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key.toLowerCase().includes("password") ? "********" : maskSensitive(entry),
      ]),
    );
  }

  return value;
}

function formatJson(value: unknown) {
  return JSON.stringify(maskSensitive(value), null, 2);
}

export default function DesktopClientPage() {
  const [settings, setSettings] = useState<DesktopSettings>({});
  const [exePath, setExePath] = useState("");
  const [doganiumUsername, setDoganiumUsername] = useState("");
  const [doganiumPassword, setDoganiumPassword] = useState("");
  const [status, setStatus] = useState("Hazır");
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasDesktopApi, setHasDesktopApi] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  async function runAction<T>(
    label: string,
    action: (api: DesktopApi) => Promise<DesktopResult<T>>,
    onSuccess?: (result: DesktopResult<T>) => void,
  ) {
    const api = window.desktopApi;

    if (!api) {
      const result = {
        ok: false,
        error: "DESKTOP_PRELOAD_API_MISSING",
        details: "window.desktopApi bulunamadı.",
      };
      setLastResult(result);
      setStatus("Electron preload API bulunamadı. Bu sayfayı Electron içinde açın.");
      return;
    }

    setBusy(true);
    setSettingsSaved(false);
    setStatus(`${label} çalışıyor...`);

    try {
      const result = await action(api);
      setLastResult(result);

      if (result.ok) {
        setStatus(`${label} başarılı`);
        onSuccess?.(result);
      } else {
        setStatus(`${label} hatası: ${result.error || "Bilinmeyen hata"}`);
      }
    } catch (error) {
      const result = { ok: false, error: error instanceof Error ? error.message : String(error) };
      setLastResult(result);
      setStatus(`${label} exception verdi`);
    } finally {
      setBusy(false);
    }
  }

  async function loadSettings() {
    await runAction("Ayarları yükle", (api) => api.readSettings(), (result) => {
      if (result.data) {
        setSettings(result.data);
        setExePath(result.data.doganiumExePath || "");
        setDoganiumUsername(result.data.doganiumUsername || "");
        setDoganiumPassword(result.data.doganiumPassword || "");
      }
    });
  }

  useEffect(() => {
    const available = typeof window !== "undefined" && !!window.desktopApi;
    setMounted(true);
    setHasDesktopApi(available);

    if (!available) {
      setStatus("Electron preload API bulunamadı. Browser değil Electron penceresini kullanın.");
      setLastResult({ ok: false, error: "DESKTOP_PRELOAD_API_MISSING" });
      return;
    }

    void runAction("IPC ping", (api) => api.ping());
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSettings() {
    await runAction(
      "Ayarları kaydet",
      (api) =>
        api.writeSettings({
          doganiumExePath: exePath,
          doganiumUsername,
          doganiumPassword,
          devtoolsPort: 9222,
        }),
      (result) => {
        if (result.data) {
          setSettings(result.data);
          setSettingsSaved(true);
        }
      },
    );
  }

  async function selectExe() {
    await runAction("Exe seç", (api) => api.selectDoganiumExe(), (result) => {
      if (result.data) {
        setExePath(result.data.exePath);
        setSettings(result.data.settings);
      }
    });
  }

  async function testPath() {
    await runAction("Yolu test et", (api) => api.testDoganiumPath(exePath));
  }

  async function startDoganium() {
    await runAction("Doganium'u başlat", (api) => api.startDoganium(exePath));
  }

  async function checkDevTools() {
    await runAction("DevTools kontrol", (api) => api.checkDevTools());
  }

  async function startLogin() {
    await runAction("Login Başlat", (api) => api.startLogin());
  }

  const actionsDisabled = !mounted || !hasDesktopApi || busy;
  const preloadTone = !mounted ? "neutral" : hasDesktopApi ? "green" : "red";
  const preloadText = !mounted ? "Kontrol ediliyor" : hasDesktopApi ? "Aktif" : "Yok";

  return (
    <AppShell
      active="desktop"
      title="Doganium Teknik Paneli"
      description="Kurulum, debug, DevTools ve login hazırlık kontrolleri. Günlük teklif operasyonu için Operasyon Paneli kullanılmalıdır."
      badge="Teknik kontrol ekranı"
      actions={
        <div className="flex items-center gap-2">
          <SoftBadge tone={preloadTone}>Preload {preloadText}</SoftBadge>
          <Button asChild variant="outline" size="lg" className="h-9 rounded-xl border-[var(--ares-border)] bg-white/[0.08] px-3 text-sm text-white hover:bg-white/[0.12] hover:text-white">
            <a href="/dashboard">Operasyon Paneli</a>
          </Button>
        </div>
      }
    >
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: easeOut }}
        className="grid min-w-0 grid-cols-12 gap-4"
      >
        <Card className="ares-panel-strong relative col-span-12 min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/25 xl:col-span-8">
          <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-emerald-300/12 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
          <CardHeader className="relative gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]">
                <Wrench className="mr-1 size-3.5" />
                Setup / Debug
              </Badge>
              <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/14">
                <Terminal className="mr-1 size-3.5" />
                Yerel kontrol
              </Badge>
            </div>
            <CardTitle className="ares-title mt-4 text-3xl font-black lg:text-4xl">
              Doganium otomasyon hazırlığı
            </CardTitle>
            <CardDescription className="ares-muted mt-2 max-w-3xl text-sm leading-6">
              EXE yolu, Electron preload, DevTools portu ve login başlangıcı burada yönetilir.
              Bu ekran günlük üretim akışı değil, teknik hazırlık ve debug alanıdır.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="ares-panel col-span-12 min-w-0 overflow-hidden rounded-3xl shadow-2xl shadow-black/15 xl:col-span-4">
          <CardHeader className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-amber-100">
                  Yetkili IP / ofis erişimi gerekli
                </CardTitle>
                <CardDescription className="mt-1 text-sm leading-6 text-amber-200/80">
                  Gerçek Doganium login ve otomasyon adımları yetkili ortam olmadan ilerletilmemelidir.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.section>

      <section className="grid min-w-0 grid-cols-12 gap-3">
        <TechnicalStatusCard label="Preload" value={preloadText} tone={preloadTone} icon={Cpu} index={0} />
        <TechnicalStatusCard label="DevTools" value="Port 9222" tone="blue" icon={Wifi} index={1} />
        <TechnicalStatusCard label="IP Durumu" value="Erişim bekleniyor" tone="amber" icon={AlertTriangle} index={2} />
        <TechnicalStatusCard
          label="Ayarlar"
          value={settingsSaved ? "Kaydedildi" : settings.doganiumExePath ? "Yüklendi" : "Eksik"}
          tone={settingsSaved ? "green" : settings.doganiumExePath ? "neutral" : "amber"}
          icon={settingsSaved ? CheckCircle2 : Save}
          index={3}
        />
      </section>

      <section className="grid min-w-0 grid-cols-12 gap-4">
        <Card className="ares-panel col-span-12 min-w-0 overflow-hidden rounded-3xl xl:col-span-8">
          <CardHeader className="border-b border-[var(--ares-border)] p-5">
            <CardTitle className="ares-title text-lg font-bold">
              Kurulum ve bağlantı ayarları
            </CardTitle>
            <CardDescription className="ares-muted">
              Doganium path ve login bilgileri yerelde saklanır. Secret değerleri repoya yazmayın.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 p-5">
            <div className="ares-surface rounded-2xl p-4">
              <label className="ares-muted block text-sm font-bold" htmlFor="doganium-exe">
                Doganium.FormUI.exe
              </label>
              <div className="mt-2 flex min-w-0 gap-2">
                <input
                  id="doganium-exe"
                  value={exePath}
                  onChange={(event) => setExePath(event.target.value)}
                  placeholder={
                    "Örnek: C:\\Program Files (x86)\\Doğanium Hızlı Teklif\\Doganium.FormUI.exe"
                  }
                  className="ares-input min-w-0 flex-1 rounded-xl px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--ares-green)] focus:ring-4 focus:ring-emerald-500/10"
                />
                <Button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={selectExe}
                  className="ares-button-primary h-auto shrink-0 rounded-xl px-4 hover:opacity-90"
                >
                  <FolderOpen className="mr-2 size-4" />
                  Seç
                </Button>
              </div>
            </div>

            <div className="ares-surface grid min-w-0 gap-4 rounded-2xl p-4 md:grid-cols-2">
              <div className="min-w-0">
                <label className="ares-muted block text-sm font-bold" htmlFor="doganium-username">
                  Doganium kullanıcı adı
                </label>
                <input
                  id="doganium-username"
                  value={doganiumUsername}
                  onChange={(event) => setDoganiumUsername(event.target.value)}
                  autoComplete="username"
                  className="ares-input mt-2 w-full rounded-xl px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--ares-green)] focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <div className="min-w-0">
                <label className="ares-muted block text-sm font-bold" htmlFor="doganium-password">
                  Doganium şifre
                </label>
                <input
                  id="doganium-password"
                  value={doganiumPassword}
                  onChange={(event) => setDoganiumPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="ares-input mt-2 w-full rounded-xl px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--ares-green)] focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              <ActionGroup title="Ayarlar">
                <ActionButton disabled={actionsDisabled} onClick={saveSettings} tone="green" icon={Save}>
                  Kaydet
                </ActionButton>
              </ActionGroup>
              <ActionGroup title="Bağlantı Testleri">
                <ActionButton disabled={actionsDisabled} onClick={testPath} tone="navy" icon={CheckCircle2}>
                  Yolu test et
                </ActionButton>
                <ActionButton disabled={actionsDisabled} onClick={checkDevTools} tone="navy" icon={Wifi}>
                  DevTools kontrol
                </ActionButton>
              </ActionGroup>
              <ActionGroup title="Otomasyon">
                <ActionButton disabled={actionsDisabled} onClick={startDoganium} tone="navy" icon={PlayCircle}>
                  Doganium'u başlat
                </ActionButton>
                <ActionButton disabled={actionsDisabled} onClick={startLogin} tone="amber" icon={KeyRound}>
                  Login Başlat
                </ActionButton>
              </ActionGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="ares-panel col-span-12 min-w-0 overflow-hidden rounded-3xl xl:col-span-4">
          <CardHeader className="border-b border-[var(--ares-border)] p-5">
            <CardTitle className="ares-title text-lg font-bold">Teknik durum</CardTitle>
            <CardDescription className="ares-muted">Son aksiyon, kayıtlı yol ve güvenli çalışma notları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="ares-panel-strong rounded-2xl p-5 shadow-lg shadow-black/20">
              <p className="text-sm font-semibold text-emerald-100/70">Son durum</p>
              <h2 className="mt-2 text-2xl font-black">{status}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Yetkili IP/ofis erişimi yoksa gerçek login ve teklif otomasyonu bekletilmelidir.
              </p>
            </div>

            <div className="ares-surface rounded-2xl p-4 text-sm">
              <p className="font-bold text-slate-100">Kaydedilen yol</p>
              <p className="mt-2 break-all text-slate-400">{settings.doganiumExePath || "Henüz yok"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="ares-panel min-w-0 overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-[var(--ares-border)] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="ares-title text-lg font-bold">Çıktı / Log</CardTitle>
              <CardDescription className="ares-muted">Son teknik aksiyonun maskelenmiş JSON çıktısı.</CardDescription>
            </div>
            <Badge variant="outline" className="border-[var(--ares-border)] bg-white/5 text-slate-100">
              <Terminal className="mr-1 size-3.5" />
              Terminal
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-5">
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-[var(--ares-border)] bg-[var(--ares-deep)] p-5 text-xs leading-6 text-emerald-50 shadow-inner">
            {formatJson(lastResult)}
          </pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function TechnicalStatusCard({
  label,
  value,
  tone,
  icon: Icon,
  index,
}: {
  label: string;
  value: string;
  tone: "neutral" | "green" | "red" | "amber" | "blue";
  icon: ComponentType<{ className?: string }>;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.17, delay: 0.03 + index * 0.02, ease: easeOut }}
      className="col-span-6 min-w-0 md:col-span-3"
    >
      <Card className="ares-panel rounded-2xl shadow-lg shadow-black/15">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="ares-muted truncate text-sm font-semibold">{label}</p>
              <div className="mt-3">
                <SoftBadge tone={tone}>{value}</SoftBadge>
              </div>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ares-border-strong)] bg-emerald-400/10 text-emerald-300">
              <Icon className="size-5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ares-surface rounded-2xl p-3">
      <p className="ares-muted mb-2 text-xs font-bold uppercase">{title}</p>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function ActionButton({
  disabled,
  onClick,
  tone,
  icon: Icon,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  tone: "green" | "navy" | "amber";
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  const toneClass = {
    green: "ares-button-primary hover:opacity-90",
    navy: "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-[var(--ares-border)]",
    amber: "bg-amber-500/16 text-amber-100 hover:bg-amber-500/22 border border-amber-400/20",
  }[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-55 ${toneClass}`}
    >
      <Icon className="mr-2 size-4" />
      {children}
    </button>
  );
}

function SoftBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "green" | "red" | "amber" | "blue";
}) {
  const className = {
    neutral: "border-white/10 bg-white/[0.08] text-slate-200",
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    red: "border-red-400/25 bg-red-400/10 text-red-200",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    blue: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  }[tone];

  return (
    <Badge variant="outline" className={`font-bold shadow-sm ${className}`}>
      {children}
    </Badge>
  );
}
