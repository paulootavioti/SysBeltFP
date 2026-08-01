import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// porta fixa (5175) — sgcl-web usa 5173; o backend já libera as duas
// origens por padrão em CORS_ORIGIN (ver src/app.ts na API).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
  },
})
