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

function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,

    skipTaskbar: true,
    hasShadow: false,
    resizable: true,
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
  }
}

app.on('ready', () => {
  createWindow()

  const ok = globalShortcut.register('CommandOrControl+Shift+P', () => {
      console.log("✅ Main: CommandOrControl+Shift+P registered")
       if (win && !win.isDestroyed()) {
         win.webContents.send('hotkey:record-toggle')
       }
     })

//   // Register F7 globally
//   if (!globalShortcut.register('F7', () => {
//     console.log('✅ Main: F7 pressed → sending IPC')
//     if (win && !win.isDestroyed()) {
//       win.webContents.send('hotkey:record-toggle')
//     }
//   })) {
//     console.error('❌ Main: F7 registration failed')
//   }

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
