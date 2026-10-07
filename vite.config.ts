import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/opencode': {
          target: 'https://opencode.ai',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/opencode/, '/zen'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.OPENCODE_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.OPENCODE_API_KEY}`)
              }
            })
          },
        },
      },
    },
  }
})
