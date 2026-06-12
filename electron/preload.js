const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  readSettings: () => ipcRenderer.invoke("desktop:readSettings"),
  writeSettings: (settings) => ipcRenderer.invoke("desktop:writeSettings", settings),
  selectDoganiumExe: () => ipcRenderer.invoke("desktop:selectDoganiumExe"),
  testDoganiumPath: (exePath) => ipcRenderer.invoke("desktop:testDoganiumPath", exePath),
  startDoganium: (exePath) => ipcRenderer.invoke("desktop:startDoganium", exePath),
});
