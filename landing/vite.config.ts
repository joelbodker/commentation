import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves project sites at https://<user>.github.io/<repo>/
  base: process.env.BASE_URL || '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@commentation': path.resolve(__dirname, '../frontend/src'),
    },
  },
  server: {
    port: 5174,
  },
})
