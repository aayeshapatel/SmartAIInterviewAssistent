// // frontend/electron/main.js
// const { app, BrowserWindow, globalShortcut } = require('electron')
// const path = require('path')
//
// let win
// function createWindow() {
//   win = new BrowserWindow({
//     width: 600,
//     height: 200,
//     transparent: true,
//     frame: false,
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     }
//   })
//   const url = process.env.VITE_DEV_SERVER_URL
//     || `file://${path.join(__dirname, '../dist/index.html')}`
//   win.loadURL(url)
//
//   // Ctrl+Shift+R to toggle recording
//   globalShortcut.register('f7', () => {
//     win.webContents.send('hotkey:record-toggle')
//   })
// }
//
// app.whenReady().then(createWindow)
// app.on('window-all-closed', () => app.quit())


//
// // frontend/electron/main.cjs
//
// const { app, BrowserWindow, globalShortcut } = require('electron')
// const path = require('path')
//
// let win
//
// function createWindow() {
//   win = new BrowserWindow({
//     width: 600,
//     height: 300,
//     transparent: true,
//     frame: false,
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     hasShadow: false,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     }
//   })
//
//   const url = process.env.VITE_DEV_SERVER_URL
//     || `file://${path.join(__dirname, '../dist/index.html')}`
//   win.loadURL(url)
// }
//
// app.whenReady().then(() => {
//   createWindow()
//
//   // Register F7 as a global hotkey
//   const ok = globalShortcut.register('F7', () => {
//       console.log('🖱️  Main: F7 pressed')
//     if (win && !win.isDestroyed()) {
//       win.webContents.send('hotkey:record-toggle')
//     }
//   })
//   if (!ok) {
//     console.error('❌ F7 registration failed')
//   }
//
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow()
//     }
//   })
// })
//
// app.on('will-quit', () => {
//   globalShortcut.unregisterAll()
// })
//
// app.on('window-all-closed', () => {
//   // On macOS, apps stay open until Cmd+Q
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })
//
//
// // frontend/electron/main.cjs
// const { app, BrowserWindow, globalShortcut } = require('electron')
// const path = require('path')
//
// let win
//
// function createWindow() {
//   win = new BrowserWindow({
//     width: 600,
//     height: 300,
//     transparent: true,
//
//     frame: false,
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     hasShadow: false,
//     focusable: true,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     }
//   })
//
//   const url = process.env.VITE_DEV_SERVER_URL
//     || `file://${path.join(__dirname, '../dist/index.html')}`
//   win.loadURL(url)
//
//   // 👉 Open DevTools for the overlay so you can see renderer logs
//   win.webContents.openDevTools({ mode: 'detach' })
// }
//
// app.whenReady().then(() => {
//   createWindow()
//
//   // 👉 Register F7
//   const ok = globalShortcut.register('F7', () => {
//     console.log('🖱️  Main: F7 pressed')    // <-- logs in your terminal
//     if (win && !win.isDestroyed()) {
//       win.webContents.send('hotkey:record-toggle')
//     }
//   })
//   if (!ok) {
//     console.error('❌ Main: F7 registration failed')
//   } else {
//     console.log('✅ Main: F7 registered')
//   }
//
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow()
//     }
//   })
// })
//
// app.on('will-quit', () => {
//   globalShortcut.unregisterAll()
// })
//
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })
// frontend/electron/main.cjs
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('path')

let win

// function createWindow() {
//   win = new BrowserWindow({
//     width: 500,
//     height: 200,
//     transparent: true,
//     frame: false,
//     alwaysOnTop: true,
//     level: 'screen-saver',           // Highest level to stay on top of everything
//     visibleOnAllWorkspaces: true,    // Show on every Space/Desktop
//     focusable: false,               // Prevents the window from stealing focus
//     skipTaskbar: true,
//     hasShadow: false,
//     resizable: true,
//     type: 'panel',                  // Makes it a floating panel
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.cjs'),
//       contextIsolation: true,
//       nodeIntegration: false,
//     }
//   })
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
