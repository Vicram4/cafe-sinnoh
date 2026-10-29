/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // En desarrollo, /api se reenvía a uvicorn: la web y la API comparten
  // origen igual que en Docker (nginx) y en producción. Hace falta para la
  // cookie de sesión (SameSite=Strict, ruta /api/v1/auth).
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
