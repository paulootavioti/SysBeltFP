import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { versaoPlugin } from '../scripts/versaoBuild.mjs'

// https://vite.dev/config/
export default defineConfig({
  // version.json diz de qual commit este build saiu (ver scripts/verificarDeploy.mjs)
  plugins: [react(), versaoPlugin('web')],
})
