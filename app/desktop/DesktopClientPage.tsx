"use client";

import { useEffect, useState } from "react";

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
  path?: string;
  pid?: number;
  args?: string[];
  cancelled?: boolean;
}

interface DesktopApi {
  readSettings: () => Promise<DesktopResult<DesktopSettings>>;
  writeSettings: (settings: DesktopSettings) => Promise<DesktopResult<DesktopSettings>>;
  selectDoganiumExe: () => Promise<DesktopResult<{ exePath: string; settings: DesktopSettings }>>;
  testDoganiumPath: (exePath?: string) => Promise<DesktopResult>;
  startDoganium: (exePath?: string) => Promise<DesktopResult>;
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
  const [status, setStatus] = useState("HazÄ±r");
  const [lastResult, setLastResult] = useState<unknown>(null);

  async function loadSettings() {
    if (!window.desktopApi) {
      setStatus("Electron preload API bulunamadÄ±. Bu sayfayÄ± Electron iÃ§inde aÃ§malÄ±sÄ±n.");
      return;
    }

    const result = await window.desktopApi.readSettings();
    setLastResult(result);
    if (result.ok && result.data) {
      setSettings(result.data);
      setExePath(result.data.doganiumExePath || "");
      setStatus("Ayarlar yÃ¼klendi");
    } else {
      setStatus(result.error || "Ayarlar okunamadÄ±");
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function saveSettings() {
    if (!window.desktopApi) return;
    const result = await window.desktopApi.writeSettings({ doganiumExePath: exePath, devtoolsPort: 9222 });
    setLastResult(result);
    if (result.ok && result.data) {
      setSettings(result.data);
      setStatus("Ayarlar kaydedildi");
    } else {
      setStatus(result.error || "Ayarlar kaydedilemedi");
    }
  }

  async function selectExe() {
    if (!window.desktopApi) return;
    const result = await window.desktopApi.selectDoganiumExe();
    setLastResult(result);
    if (result.ok && result.data) {
      setExePath(result.data.exePath);
      setSettings(result.data.settings);
      setStatus("Doganium exe yolu seÃ§ildi");
    } else if (result.cancelled) {
      setStatus("SeÃ§im iptal edildi");
    } else {
      setStatus(result.error || "Exe seÃ§ilemedi");
    }
  }

  async function testPath() {
    if (!window.desktopApi) return;
    const result = await window.desktopApi.testDoganiumPath(exePath);
    setLastResult(result);
    setStatus(result.ok ? "Doganium yolu geÃ§erli" : `Yol hatasÄ±: ${result.error || "Bilinmeyen hata"}`);
  }

  async function startDoganium() {
    if (!window.desktopApi) return;
    const result = await window.desktopApi.startDoganium(exePath);
    setLastResult(result);
    setStatus(result.ok ? `Doganium baÅŸlatÄ±ldÄ±. PID: ${result.pid || "-"}` : `BaÅŸlatma hatasÄ±: ${result.error || "Bilinmeyen hata"}`);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Desktop MVP</p>
            <h1 style={{ margin: "6px 0 8px", fontSize: 34, letterSpacing: -0.8 }}>Doganium WhatsApp Otomasyon</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: 760 }}>
              Bu ekran Electron penceresi, Doganium yolu ve temel masaÃ¼stÃ¼ baÅŸlatma akÄ±ÅŸÄ± iÃ§in yeniden kurulan kontrol panelidir.
            </p>
          </div>
          <a href="/dashboard" style={{ padding: "12px 16px", borderRadius: 12, background: "#0f172a", color: "white", textDecoration: "none", fontWeight: 700 }}>
            Dashboard
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
            <h2 style={{ marginTop: 0 }}>Doganium exe yolu</h2>
            <label style={{ display: "block", color: "#475569", fontSize: 14, marginBottom: 8 }}>Doganium.FormUI.exe</label>
            <input
              value={exePath}
              onChange={(event) => setExePath(event.target.value)}
              placeholder="Ã–rnek: C:\\Program Files\\DoÄŸanium HÄ±zlÄ± Teklif\\Doganium.FormUI.exe"
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button onClick={selectExe} style={buttonStyle("#334155", "white")}>Exe seÃ§</button>
              <button onClick={saveSettings} style={buttonStyle("#0f766e", "white")}>Kaydet</button>
              <button onClick={testPath} style={buttonStyle("#2563eb", "white")}>Yolu test et</button>
              <button onClick={startDoganium} style={buttonStyle("#111827", "white")}>Doganium'u baÅŸlat</button>
            </div>
          </div>

          <div style={{ background: "#0f172a", color: "white", borderRadius: 20, padding: 24, boxShadow: "0 12px 30px rgba(15,23,42,0.16)" }}>
            <p style={{ color: "#94a3b8", marginTop: 0 }}>Durum</p>
            <h2 style={{ marginTop: 0 }}>{status}</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              DevTools portu varsayÄ±lan olarak 9222 kullanÄ±lÄ±r. Doganium farklÄ± klasÃ¶rdeyse exe yolunu seÃ§ip kaydet.
            </p>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, fontSize: 13 }}>
              <div><strong>Kaydedilen yol:</strong></div>
              <div style={{ wordBreak: "break-all", color: "#e2e8f0", marginTop: 6 }}>{settings.doganiumExePath || "HenÃ¼z yok"}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Son iÅŸlem Ã§Ä±ktÄ±sÄ±</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f1f5f9", borderRadius: 14, padding: 16, overflow: "auto", maxHeight: 320 }}>
            {formatJson(lastResult)}
          </pre>
        </div>
      </section>
    </main>
  );
}

function buttonStyle(background: string, color: string): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 12,
    padding: "11px 14px",
    background,
    color,
    fontWeight: 700,
    cursor: "pointer",
  };
}
