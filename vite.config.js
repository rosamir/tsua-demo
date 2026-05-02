import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base path is set by GitHub Actions deploy workflow via VITE_BASE_PATH env var
  // e.g. /tsua-demo/ for github.io/tsua-demo
  base: process.env.VITE_BASE_PATH || '/',
})
