import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { garimpoDevApi } from './vite-plugin-garimpo-dev-api.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    garimpoDevApi(),
    react(),
    legacy({
      // Define os alvos: navegadores com mais de 1% de uso ou versões específicas
      targets: ['defaults', 'not IE 11', 'ios >= 12'],
      // Garante que o Polyfill (tradutor de funções novas) seja incluído
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    }),
  ],
  build: {
    target: 'es2015',
    cssTarget: 'chrome61',
    minify: 'terser',
    // Esta opção ajuda a evitar erros de carregamento em redes oscilantes
    chunkSizeWarningLimit: 1000,
  },
})
