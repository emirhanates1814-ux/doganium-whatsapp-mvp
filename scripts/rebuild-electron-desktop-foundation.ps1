$ErrorActionPreference = 'Stop'

function Write-Step($Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

$Root = Get-Location
$PackageJsonPath = Join-Path $Root 'package.json'

if (!(Test-Path $PackageJsonPath)) {
  throw "package.json bulunamadı. Bu script proje kökünde çalıştırılmalı. Örnek: cd C:\Projects\doganium-whatsapp-mvp"
}

Write-Step "Proje kökü"
Write-Host $Root

Write-Step "Klasörler oluşturuluyor"
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'electron') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'electron\scripts') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'app\desktop') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root '.desktop') | Out-Null

Write-Step "electron/main.js yazılıyor"
@'
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");

let mainWindow = null;

const APP_TITLE = "Doganium WhatsApp Otomasyon";
const DEV_URL = process.env.DESKTOP_URL || "http://127.0.0.1:3000/desktop";

function getProjectRoot() {
  return path.resolve(__dirname, "..");
}

function getDesktopDir() {
  const dir = path.join(getProjectRoot(), ".desktop");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getSettingsPath() {
  return path.join(getDesktopDir(), "settings.json");
}

function readSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return {
      doganiumExePath: "",
      devtoolsPort: 9222,
      devtoolsArgs: ["--remote-debugging-port=9222", "--remote-allow-origins=*"],
    };
  }

  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (error) {
    return {
      doganiumExePath: "",
      devtoolsPort: 9222,
      devtoolsArgs: ["--remote-debugging-port=9222", "--remote-allow-origins=*"],
      settingsReadError: String(error && error.message ? error.message : error),
    };
  }
}

function writeSettings(nextSettings) {
  const current = readSettings();
  const merged = {
    ...current,
    ...nextSettings,
    devtoolsPort: Number(nextSettings.devtoolsPort || current.devtoolsPort || 9222),
  };

  fs.writeFileSync(getSettingsPath(), JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

function showAndFocusWindow() {
  if (!mainWindow) return;
  if (!mainWindow.isVisible()) mainWindow.show();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    center: true,
    title: APP_TITLE,
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", showAndFocusWindow);
  mainWindow.webContents.on("did-finish-load", showAndFocusWindow);
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Electron did-fail-load", { errorCode, errorDescription, validatedURL });
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(DEV_URL);
}

function registerIpcHandlers() {
  ipcMain.handle("desktop:readSettings", async () => {
    return { ok: true, data: readSettings() };
  });

  ipcMain.handle("desktop:writeSettings", async (_event, settings) => {
    return { ok: true, data: writeSettings(settings || {}) };
  });

  ipcMain.handle("desktop:selectDoganiumExe", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Doganium.FormUI.exe seç",
      properties: ["openFile"],
      filters: [{ name: "Executable", extensions: ["exe"] }],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { ok: false, cancelled: true };
    }

    const exePath = result.filePaths[0];
    const settings = writeSettings({ doganiumExePath: exePath });
    return { ok: true, data: { exePath, settings } };
  });

  ipcMain.handle("desktop:testDoganiumPath", async (_event, exePath) => {
    const target = exePath || readSettings().doganiumExePath;
    if (!target) return { ok: false, error: "DOGANIUM_PATH_EMPTY" };
    if (!fs.existsSync(target)) return { ok: false, error: "DOGANIUM_PATH_NOT_FOUND", path: target };
    return { ok: true, path: target };
  });

  ipcMain.handle("desktop:startDoganium", async (_event, exePath) => {
    const settings = readSettings();
    const target = exePath || settings.doganiumExePath;
    if (!target) return { ok: false, error: "DOGANIUM_PATH_EMPTY" };
    if (!fs.existsSync(target)) return { ok: false, error: "DOGANIUM_PATH_NOT_FOUND", path: target };

    const args = Array.isArray(settings.devtoolsArgs)
      ? settings.devtoolsArgs
      : ["--remote-debugging-port=9222", "--remote-allow-origins=*"];

    const child = spawn(target, args, {
      detached: true,
      stdio: "ignore",
      cwd: path.dirname(target),
    });
    child.unref();

    return { ok: true, pid: child.pid, path: target, args };
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
'@ | Set-Content -Path (Join-Path $Root 'electron\main.js') -Encoding UTF8

Write-Step "electron/preload.js yazılıyor"
@'
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  readSettings: () => ipcRenderer.invoke("desktop:readSettings"),
  writeSettings: (settings) => ipcRenderer.invoke("desktop:writeSettings", settings),
  selectDoganiumExe: () => ipcRenderer.invoke("desktop:selectDoganiumExe"),
  testDoganiumPath: (exePath) => ipcRenderer.invoke("desktop:testDoganiumPath", exePath),
  startDoganium: (exePath) => ipcRenderer.invoke("desktop:startDoganium", exePath),
});
'@ | Set-Content -Path (Join-Path $Root 'electron\preload.js') -Encoding UTF8

Write-Step "electron/scripts/runPowerShell.js yazılıyor"
@'
const { spawn } = require("node:child_process");

function runPowerShell(command, options = {}) {
  return new Promise((resolve) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
      cwd: options.cwd || process.cwd(),
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
}

module.exports = { runPowerShell };
'@ | Set-Content -Path (Join-Path $Root 'electron\scripts\runPowerShell.js') -Encoding UTF8

Write-Step "app/desktop/page.tsx yazılıyor"
@'
import DesktopClientPage from "./DesktopClientPage";

export default function DesktopPage() {
  return <DesktopClientPage />;
}
'@ | Set-Content -Path (Join-Path $Root 'app\desktop\page.tsx') -Encoding UTF8

Write-Step "app/desktop/DesktopClientPage.tsx yazılıyor"
@'
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
  const [status, setStatus] = useState("Hazır");
  const [lastResult, setLastResult] = useState<unknown>(null);

  async function loadSettings() {
    if (!window.desktopApi) {
      setStatus("Electron preload API bulunamadı. Bu sayfayı Electron içinde açmalısın.");
      return;
    }

    const result = await window.desktopApi.readSettings();
    setLastResult(result);
    if (result.ok && result.data) {
      setSettings(result.data);
      setExePath(result.data.doganiumExePath || "");
      setStatus("Ayarlar yüklendi");
    } else {
      setStatus(result.error || "Ayarlar okunamadı");
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
      setStatus("Doganium exe yolu seçildi");
    } else if (result.cancelled) {
      setStatus("Seçim iptal edildi");
    } else {
      setStatus(result.error || "Exe seçilemedi");
    }
  }

  async function testPath() {
    if (!window.desktopApi) return;
    const result = await window.desktopApi.testDoganiumPath(exePath);
    setLastResult(result);
    setStatus(result.ok ? "Doganium yolu geçerli" : `Yol hatası: ${result.error || "Bilinmeyen hata"}`);
  }

  async function startDoganium() {
    if (!window.desktopApi) return;
    const result = await window.desktopApi.startDoganium(exePath);
    setLastResult(result);
    setStatus(result.ok ? `Doganium başlatıldı. PID: ${result.pid || "-"}` : `Başlatma hatası: ${result.error || "Bilinmeyen hata"}`);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Desktop MVP</p>
            <h1 style={{ margin: "6px 0 8px", fontSize: 34, letterSpacing: -0.8 }}>Doganium WhatsApp Otomasyon</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: 760 }}>
              Bu ekran Electron penceresi, Doganium yolu ve temel masaüstü başlatma akışı için yeniden kurulan kontrol panelidir.
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
              placeholder="Örnek: C:\\Program Files\\Doğanium Hızlı Teklif\\Doganium.FormUI.exe"
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button onClick={selectExe} style={buttonStyle("#334155", "white")}>Exe seç</button>
              <button onClick={saveSettings} style={buttonStyle("#0f766e", "white")}>Kaydet</button>
              <button onClick={testPath} style={buttonStyle("#2563eb", "white")}>Yolu test et</button>
              <button onClick={startDoganium} style={buttonStyle("#111827", "white")}>Doganium'u başlat</button>
            </div>
          </div>

          <div style={{ background: "#0f172a", color: "white", borderRadius: 20, padding: 24, boxShadow: "0 12px 30px rgba(15,23,42,0.16)" }}>
            <p style={{ color: "#94a3b8", marginTop: 0 }}>Durum</p>
            <h2 style={{ marginTop: 0 }}>{status}</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              DevTools portu varsayılan olarak 9222 kullanılır. Doganium farklı klasördeyse exe yolunu seçip kaydet.
            </p>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, fontSize: 13 }}>
              <div><strong>Kaydedilen yol:</strong></div>
              <div style={{ wordBreak: "break-all", color: "#e2e8f0", marginTop: 6 }}>{settings.doganiumExePath || "Henüz yok"}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Son işlem çıktısı</h3>
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
'@ | Set-Content -Path (Join-Path $Root 'app\desktop\DesktopClientPage.tsx') -Encoding UTF8

Write-Step "package.json güncelleniyor"
$pkg = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
$pkg | Add-Member -NotePropertyName main -NotePropertyValue 'electron/main.js' -Force

if (-not $pkg.scripts) {
  $pkg | Add-Member -NotePropertyName scripts -NotePropertyValue ([pscustomobject]@{}) -Force
}

$pkg.scripts | Add-Member -NotePropertyName 'dev:web' -NotePropertyValue 'next dev' -Force
$pkg.scripts | Add-Member -NotePropertyName 'dev:electron' -NotePropertyValue 'electron .' -Force
$pkg.scripts | Add-Member -NotePropertyName 'desktop:dev' -NotePropertyValue 'concurrently "npm.cmd run dev:web" "wait-on http://127.0.0.1:3000/desktop && npm.cmd run dev:electron"' -Force
$pkg.scripts | Add-Member -NotePropertyName 'desktop:electron' -NotePropertyValue 'electron .' -Force

$pkg | ConvertTo-Json -Depth 20 | Set-Content $PackageJsonPath -Encoding UTF8

Write-Step "Eksik dev dependencies kuruluyor"
npm.cmd install --save-dev electron concurrently wait-on

Write-Step "Kontroller"
node --check electron\main.js
node --check electron\preload.js
node --check electron\scripts\runPowerShell.js
npm.cmd run typecheck

Write-Step "Tamamlandı"
Write-Host "Şimdi başlatmak için:" -ForegroundColor Green
Write-Host "npm.cmd run desktop:dev" -ForegroundColor Green
