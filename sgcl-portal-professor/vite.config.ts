import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { versaoPlugin } from '../scripts/versaoBuild.mjs'

// porta fixa (5176) — sgcl-web usa 5173, sgcl-portal-familia usa 5175; o
// backend já libera as três origens por padrão em CORS_ORIGIN (ver
// src/app.ts na API).
export default defineConfig({
  // version.json diz de qual commit este build saiu (ver scripts/verificarDeploy.mjs)
  plugins: [react(), versaoPlugin('portal-professor')],
  server: {
    port: 5176,
  },
})
