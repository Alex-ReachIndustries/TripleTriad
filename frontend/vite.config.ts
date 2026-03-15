import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    rollupOptions: {
      // BLE plugin only available in Capacitor Android builds, not web
      external: ['@capacitor-community/bluetooth-le'],
    },
  },
})
