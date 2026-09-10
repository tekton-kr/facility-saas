import react from '@vitejs/plugin-react'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import { defineConfig, loadEnv } from 'vite'

function requireApiOrigin(apiOrigin: string | undefined): Plugin {
  function attach(server: ViteDevServer | PreviewServer) {
    server.middlewares.use((req, res, next) => {
      if (apiOrigin || !req.url?.startsWith('/api')) {
        next()
        return
      }
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'API_ORIGIN이 없습니다. .env에 중앙 서버 origin을 넣으십시오.' }))
    })
  }
  return {
    name: 'require-api-origin',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.API_ORIGIN?.trim()
  const proxy = apiOrigin
    ? {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
      }
    : undefined

  return {
    plugins: [react(), requireApiOrigin(apiOrigin)],
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
  }
})
