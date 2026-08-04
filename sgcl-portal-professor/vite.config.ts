import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// porta fixa (5176) — sgcl-web usa 5173, sgcl-portal-familia usa 5175; o
// backend já libera as três origens por padrão em CORS_ORIGIN (ver
// src/app.ts na API).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
  },
})
