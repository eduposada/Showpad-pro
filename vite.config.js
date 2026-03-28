import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Define o alvo para navegadores de 2015 (compatível com iPad Mini 2 / iOS 12)
    target: 'es2015', 
    cssTarget: 'chrome61', // Garante que o visual (CSS) também não quebre
    minify: 'terser', // Usa um tradutor mais robusto para códigos antigos
  }
})