import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const DEV_API = 'https://saas-api2.tekton.co.kr'
const PROD_API = 'https://saas-api.tekton.co.kr'

function proxyTo(target: string) {
  return {
    '/api': {
      target,
      changeOrigin: true,
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const devServer = command === 'serve' && mode === 'development'
  const origin = devServer ? DEV_API : PROD_API
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: proxyTo(origin),
    },
    preview: {
      port: 4173,
      proxy: proxyTo(PROD_API),
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
  }
})
