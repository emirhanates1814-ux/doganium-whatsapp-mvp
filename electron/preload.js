const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  ping: () => ipcRenderer.invoke("desktop:ping"),
  readSettings: () => ipcRenderer.invoke("desktop:readSettings"),
  writeSettings: (settings) => ipcRenderer.invoke("desktop:writeSettings", settings),
  selectDoganiumExe: () => ipcRenderer.invoke("desktop:selectDoganiumExe"),
  testDoganiumPath: (exePath) => ipcRenderer.invoke("desktop:testDoganiumPath", exePath),
  startDoganium: (exePath) => ipcRenderer.invoke("desktop:startDoganium", exePath),
  checkDevTools: () => ipcRenderer.invoke("desktop:checkDevTools"),
  startLogin: () => ipcRenderer.invoke("desktop:startLogin"),
});

console.log("[preload] desktopApi exposed");
