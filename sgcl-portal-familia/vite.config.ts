import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { versaoPlugin } from '../scripts/versaoBuild.mjs'

// porta fixa (5175) — sgcl-web usa 5173; o backend já libera as duas
// origens por padrão em CORS_ORIGIN (ver src/app.ts na API).
export default defineConfig({
  // version.json diz de qual commit este build saiu (ver scripts/verificarDeploy.mjs)
  plugins: [react(), versaoPlugin('portal-familia')],
  server: {
    port: 5175,
  },
})
