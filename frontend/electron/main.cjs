// frontend/electron/main.cjs
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron')
const path = require('path')

let win
let isScreenSharing = false

// Function to check if screen sharing is active
function checkScreenSharing() {
  const displays = screen.getAllDisplays()
  // On macOS, when screen sharing is active, a new display is usually added
  if (displays.length > 1) {
    if (!isScreenSharing) {
      isScreenSharing = true
      if (win && !win.isDestroyed()) {
        win.hide()
      }
    }
  } else {
    if (isScreenSharing) {
      isScreenSharing = false
      if (win && !win.isDestroyed()) {
        win.show()
      }
    }
  }
}

  function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    level: 'screen-saver',           // Highest level to stay on top of everything
    visibleOnAllWorkspaces: true,    // Show on every Space/Desktop
    focusable: false,               // Prevents the window from stealing focus
    skipTaskbar: true,
    hasShadow: false,
    resizable: true,
    type: 'panel',                  // Makes it a floating panel
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  const devURL = process.env.VITE_DEV_SERVER_URL
  if (devURL) {
    win.loadURL(devURL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }) //new add
  }
}

app.on('ready', () => {
  createWindow()

  // Start checking for screen sharing
  setInterval(checkScreenSharing, 1000)

  // Register Ctrl+H to toggle window visibility
  const hideOk = globalShortcut.register('Control+H', () => {
    if (!win || win.isDestroyed()) return
    if (win.isVisible()) win.hide()
    else win.show()
  })
  if (!hideOk) {
    console.error('❌ Failed to register Ctrl+H')
  } else {
    console.log('✅ Main: Ctrl+H registered for hide/show')
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})