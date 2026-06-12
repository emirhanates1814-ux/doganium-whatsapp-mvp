const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const http = require("node:http");

let mainWindow = null;

const APP_TITLE = "Doganium WhatsApp Otomasyon";
const DEV_URL = "http://127.0.0.1:3000/desktop";
const DEVTOOLS_PORT = 9222;
const DEVTOOLS_ARGS = [`--remote-debugging-port=${DEVTOOLS_PORT}`, "--remote-allow-origins=*"];

function getProjectRoot() {
  return path.resolve(__dirname, "..");
}

function ok(data = null) {
  return { ok: true, data };
}

function fail(error, details) {
  return {
    ok: false,
    error,
    ...(details === undefined ? {} : { details: typeof details === "string" ? details : JSON.stringify(details) }),
  };
}

function getDesktopDir() {
  const dir = path.join(getProjectRoot(), ".desktop");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getSettingsPath() {
  return path.join(getDesktopDir(), "settings.json");
}

function defaultSettings() {
  return {
    doganiumExePath: "",
    devtoolsPort: DEVTOOLS_PORT,
    devtoolsArgs: DEVTOOLS_ARGS,
  };
}

function readSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) return defaultSettings();

  try {
    return { ...defaultSettings(), ...JSON.parse(fs.readFileSync(settingsPath, "utf8")) };
  } catch (error) {
    return { ...defaultSettings(), settingsReadError: String(error && error.message ? error.message : error) };
  }
}

function writeSettings(nextSettings) {
  const current = readSettings();
  const merged = {
    ...current,
    ...(nextSettings || {}),
    devtoolsPort: Number((nextSettings && nextSettings.devtoolsPort) || current.devtoolsPort || 9222),
  };

  if (!Array.isArray(merged.devtoolsArgs) || merged.devtoolsArgs.length === 0) {
    merged.devtoolsArgs = DEVTOOLS_ARGS;
  }

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
  const preloadPath = path.join(__dirname, "preload.js");
  const preloadExists = fs.existsSync(preloadPath);
  console.log("[electron] preload path", preloadPath);
  console.log("[electron] preload exists", preloadExists);

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
      preload: preloadPath,
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
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Electron render-process-gone", details);
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV !== "production" && process.env.ELECTRON_OPEN_DEVTOOLS !== "0") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.loadURL(DEV_URL);
}

function readJsonFromHttp(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk.toString();
      });
      response.on("end", () => {
        try {
          resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, statusCode: response.statusCode, data: JSON.parse(body) });
        } catch (error) {
          resolve({ ok: false, statusCode: response.statusCode, error: "JSON_PARSE_FAILED", raw: body });
        }
      });
    });
    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, error: "TIMEOUT" });
    });
    request.on("error", (error) => {
      resolve({ ok: false, error: error.message || String(error) });
    });
  });
}

function runPythonWorker(scriptName) {
  return new Promise((resolve) => {
    const root = getProjectRoot();
    const workerDir = path.join(root, "worker");
    const scriptPath = path.join(workerDir, scriptName);
    const venvPython = path.join(workerDir, ".venv", "Scripts", "python.exe");
    const pythonExe = fs.existsSync(venvPython) ? venvPython : "python";

    if (!fs.existsSync(scriptPath)) {
      resolve(fail("WORKER_SCRIPT_NOT_FOUND", scriptPath));
      return;
    }

    const child = spawn(pythonExe, [scriptPath], {
      cwd: workerDir,
      windowsHide: true,
      env: {
        ...process.env,
        DOGANIUM_DEVTOOLS_PORT: String(readSettings().devtoolsPort || 9222),
        PYTHONIOENCODING: "utf-8",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      resolve(fail("WORKER_SPAWN_FAILED", { message: error.message || String(error), pythonExe, scriptPath }));
    });

    child.on("close", (code) => {
      const trimmed = stdout.trim();
      try {
        const parsed = JSON.parse(trimmed || "{}");
        if (parsed && parsed.ok === false) {
          resolve(fail(parsed.error || parsed.stage || "WORKER_SCRIPT_FAILED", { ...parsed, code, stderr: stderr.trim(), pythonExe, scriptPath }));
          return;
        }
        resolve(ok({ ...parsed, code, stdout: trimmed, stderr: stderr.trim(), pythonExe, scriptPath }));
      } catch (error) {
        if (code === 0) {
          resolve(ok({ code, stdout: trimmed, stderr: stderr.trim(), pythonExe, scriptPath }));
        } else {
          resolve(fail("WORKER_SCRIPT_FAILED", { code, stdout: trimmed, stderr: stderr.trim(), pythonExe, scriptPath, parseError: error.message || String(error) }));
        }
      }
    });
  });
}

function registerIpcHandlers() {
  ipcMain.handle("desktop:ping", async () => {
    return ok({ message: "desktop IPC aktif", time: new Date().toISOString() });
  });

  ipcMain.handle("desktop:readSettings", async () => {
    return ok(readSettings());
  });

  ipcMain.handle("desktop:writeSettings", async (_event, settings) => {
    try {
      return ok(writeSettings(settings || {}));
    } catch (error) {
      return fail("SETTINGS_WRITE_FAILED", error && error.message ? error.message : String(error));
    }
  });

  ipcMain.handle("desktop:selectDoganiumExe", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Doganium.FormUI.exe sec",
      properties: ["openFile"],
      filters: [{ name: "Executable", extensions: ["exe"] }],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return fail("DIALOG_CANCELLED", "Kullanıcı dosya seçimini iptal etti.");
    }

    const exePath = result.filePaths[0];
    const settings = writeSettings({ doganiumExePath: exePath });
    return ok({ exePath, settings });
  });

  ipcMain.handle("desktop:testDoganiumPath", async (_event, exePath) => {
    const target = exePath || readSettings().doganiumExePath;
    if (!target) return fail("DOGANIUM_PATH_EMPTY", "Doganium exe yolu boş.");
    if (!fs.existsSync(target)) return fail("DOGANIUM_PATH_NOT_FOUND", target);
    return ok({ path: target });
  });

  ipcMain.handle("desktop:startDoganium", async (_event, exePath) => {
    const settings = readSettings();
    const target = exePath || settings.doganiumExePath;
    if (!target) return fail("DOGANIUM_PATH_EMPTY", "Doganium exe yolu boş.");
    if (!fs.existsSync(target)) return fail("DOGANIUM_PATH_NOT_FOUND", target);

    const args = DEVTOOLS_ARGS;

    try {
      const child = spawn(target, args, {
        detached: true,
        stdio: "ignore",
        cwd: path.dirname(target),
        windowsHide: false,
      });
      child.unref();

      return ok({ pid: child.pid, path: target, args });
    } catch (error) {
      return fail("DOGANIUM_START_FAILED", error && error.message ? error.message : String(error));
    }
  });

  ipcMain.handle("desktop:checkDevTools", async () => {
    const port = Number(readSettings().devtoolsPort || DEVTOOLS_PORT);
    const result = await readJsonFromHttp(`http://127.0.0.1:${port}/json/list`);
    if (!result.ok) return fail("DOGANIUM_DEVTOOLS_NOT_READY", { ...result, port });
    const targets = Array.isArray(result.data) ? result.data : [];
    return ok({ statusCode: result.statusCode, port, targetCount: targets.length, pageTargetCount: targets.filter((target) => target.type === "page").length, targets });
  });

  ipcMain.handle("desktop:startLogin", async () => {
    return runPythonWorker("devtools_login_start.py");
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
