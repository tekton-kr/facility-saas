import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_ORIGIN = 'https://saas-api.tekton.co.kr'

// 브라우저의 /api/* 를 https://saas-api.tekton.co.kr/api/* 로 넘긴다.
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
