import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_API_SCRAPE_URL || '').trim().replace(/\/$/, '')

  const garimpoHintPlugin = {
    name: 'showpad-garimpo-proxy-hint',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        if (!proxyTarget) {
          console.warn(
            '\n[ShowPad] Garimpo no dev: defina VITE_API_SCRAPE_URL no .env (URL da Vercel, sem / no fim) e reinicie — senão POST /api/scrape não existe e o import falha.\n'
          )
        } else {
          console.log(`\n[ShowPad] Garimpo: proxy /api/scrape → ${proxyTarget}\n`)
        }
      })
    },
  }

  return {
    plugins: [
      garimpoHintPlugin,
      react(),
      legacy({
        // Define os alvos: navegadores com mais de 1% de uso ou versões específicas
        targets: ['defaults', 'not IE 11', 'ios >= 12'],
        // Garante que o Polyfill (tradutor de funções novas) seja incluído
        additionalLegacyPolyfills: ['regenerator-runtime/runtime']
      })
    ],
    build: {
      target: 'es2015',
      cssTarget: 'chrome61',
      minify: 'terser',
      // Esta opção ajuda a evitar erros de carregamento em redes oscilantes
      chunkSizeWarningLimit: 1000,
    },
    // Garimpo no dev: mesmo fluxo que na Vercel — POST /api/scrape repassado ao deploy
    server: proxyTarget
      ? {
          proxy: {
            '/api/scrape': {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : {},
  }
})
