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
      // BLE plugin is lazy-loaded via dynamic import() — no need to externalize.
      // Capacitor native bridge provides the actual BLE implementation on Android.
    },
  },
})
