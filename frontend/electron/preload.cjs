

// frontend/electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // upper-case channel name must match what main.cjs uses
  onRecordToggle: (fn) => {
    ipcRenderer.on('hotkey:record-toggle', (_evt, ...args) => fn(...args))
  },
  onHideToggle: (fn) => {
    ipcRenderer.on('hotkey:hide-toggle', (_evt, ...args) => fn(...args))
  }
})
