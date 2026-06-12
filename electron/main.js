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
      title: "Doganium.FormUI.exe seÃ§",
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
