// frontend/electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe API to the renderer:
contextBridge.exposeInMainWorld('electronAPI', {
  onRecordToggle: (fn) => {
    ipcRenderer.on('hotkey:record-toggle', fn)
  }
})
