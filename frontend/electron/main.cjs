// frontend/electron/main.js
const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('path')

let win
function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  const url = process.env.VITE_DEV_SERVER_URL
    || `file://${path.join(__dirname, '../dist/index.html')}`
  win.loadURL(url)

  // Ctrl+Shift+R to toggle recording
  globalShortcut.register('f7', () => {
    win.webContents.send('hotkey:record-toggle')
  })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
