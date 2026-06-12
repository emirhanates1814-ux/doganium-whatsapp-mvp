"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

interface DesktopSettings {
  doganiumExePath?: string;
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

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function DesktopClientPage() {
  const [settings, setSettings] = useState<DesktopSettings>({});
  const [exePath, setExePath] = useState("");
  const [status, setStatus] = useState("Hazır");
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasDesktopApi, setHasDesktopApi] = useState(false);

  async function runAction<T>(label: string, action: (api: DesktopApi) => Promise<DesktopResult<T>>, onSuccess?: (result: DesktopResult<T>) => void) {
    const api = window.desktopApi;

    if (!api) {
      const result = { ok: false, error: "DESKTOP_PRELOAD_API_MISSING", details: "window.desktopApi bulunamadı." };
      setLastResult(result);
      setStatus("Electron preload API bulunamadı. Bu sayfayı Electron içinde açın.");
      return;
    }

    setBusy(true);
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
    await runAction("Ayarları kaydet", (api) => api.writeSettings({ doganiumExePath: exePath, devtoolsPort: 9222 }), (result) => {
      if (result.data) setSettings(result.data);
    });
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
    await runAction("Doganium’u başlat", (api) => api.startDoganium(exePath));
  }

  async function checkDevTools() {
    await runAction("DevTools kontrol", (api) => api.checkDevTools());
  }

  async function startLogin() {
    await runAction("Login Başlat", (api) => api.startLogin());
  }

  const actionsDisabled = !mounted || !hasDesktopApi || busy;
  const preloadBadgeText = !mounted ? "Preload kontrol ediliyor" : hasDesktopApi ? "Preload aktif" : "Preload yok";
  const preloadBadgeBackground = !mounted ? "#e2e8f0" : hasDesktopApi ? "#dcfce7" : "#fee2e2";
  const preloadBadgeColor = !mounted ? "#334155" : hasDesktopApi ? "#166534" : "#991b1b";

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Desktop MVP</p>
            <h1 style={{ margin: "6px 0 8px", fontSize: 34 }}>Doganium WhatsApp Otomasyon</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: 780 }}>
              Electron, Doganium başlatma ve DevTools/Login kontrol paneli. Butonlara basınca sağdaki durum ve alttaki JSON çıktısı güncellenmelidir.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ ...pillStyle, background: preloadBadgeBackground, color: preloadBadgeColor }}>
              {preloadBadgeText}
            </span>
            <a href="/dashboard" style={{ padding: "12px 16px", borderRadius: 8, background: "#0f172a", color: "white", textDecoration: "none", fontWeight: 700 }}>
              Dashboard
            </a>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)", gap: 18 }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Doganium kontrol</h2>
            <label style={{ display: "block", color: "#475569", fontSize: 14, marginBottom: 8 }}>Doganium.FormUI.exe</label>
            <input
              value={exePath}
              onChange={(event) => setExePath(event.target.value)}
              placeholder="Örnek: C:\\Program Files (x86)\\Doğanium Hızlı Teklif\\Doganium.FormUI.exe"
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button disabled={actionsDisabled} onClick={selectExe} style={buttonStyle("#334155", "white", actionsDisabled)}>Exe seç</button>
              <button disabled={actionsDisabled} onClick={saveSettings} style={buttonStyle("#0f766e", "white", actionsDisabled)}>Kaydet</button>
              <button disabled={actionsDisabled} onClick={testPath} style={buttonStyle("#2563eb", "white", actionsDisabled)}>Yolu test et</button>
              <button disabled={actionsDisabled} onClick={startDoganium} style={buttonStyle("#111827", "white", actionsDisabled)}>Doganium’u başlat</button>
              <button disabled={actionsDisabled} onClick={checkDevTools} style={buttonStyle("#7c3aed", "white", actionsDisabled)}>DevTools kontrol</button>
              <button disabled={actionsDisabled} onClick={startLogin} style={buttonStyle("#b45309", "white", actionsDisabled)}>Login Başlat</button>
            </div>
          </div>

          <div style={{ background: "#0f172a", color: "white", borderRadius: 8, padding: 24, boxShadow: "0 12px 30px rgba(15,23,42,0.16)" }}>
            <p style={{ color: "#94a3b8", marginTop: 0 }}>Durum</p>
            <h2 style={{ marginTop: 0 }}>{status}</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              İlk sıra: Yolu test et, Doganium’u başlat, DevTools kontrol, Login Başlat.
            </p>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 14, fontSize: 13 }}>
              <div><strong>Kaydedilen yol:</strong></div>
              <div style={{ wordBreak: "break-all", color: "#e2e8f0", marginTop: 6 }}>{settings.doganiumExePath || "Henüz yok"}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Son işlem çıktısı</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f1f5f9", borderRadius: 8, padding: 16, overflow: "auto", maxHeight: 420 }}>
            {formatJson(lastResult)}
          </pre>
        </div>
      </section>
    </main>
  );
}

const cardStyle: CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 24,
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
};

const pillStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

function buttonStyle(background: string, color: string, disabled: boolean): CSSProperties {
  return {
    border: 0,
    borderRadius: 8,
    padding: "11px 14px",
    background,
    color,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
}
