import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_ORIGIN = 'https://saas-api.tekton.co.kr'

const proxy = {
  '/api': {
    target: API_ORIGIN,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
  optimizeDeps: {
    include: [
      'cmdk',
      '@tanstack/react-table',
      'react',
      'react-dom',
      'react-router-dom',
    ],
  },
})
