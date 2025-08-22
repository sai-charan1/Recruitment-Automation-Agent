import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If your environment needs ESM, rename to vite.config.mjs — this is fine.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // frontend calls /api/* -> this proxy will strip /api and forward to backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
