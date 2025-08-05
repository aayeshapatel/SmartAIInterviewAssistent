//
//// https://vite.dev/config/
//export default defineConfig({
//  plugins: [react()],
//})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: { entry: 'electron/main.js' }
    })
  ]
})
