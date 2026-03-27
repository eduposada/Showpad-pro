import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015', // Linguagem mais antiga compatível com iPad Mini 2
    cssTarget: 'chrome61'
  }
})