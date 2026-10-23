// Carimbo de versão de cada build publicado. Cada site expõe de qual commit
// saiu (/version.json nos frontends, /api/version na API), e
// scripts/verificarDeploy.mjs compara isso com a main — é a forma de provar
// que um site não ficou para trás num deploy que falhou em silêncio.
//
// No Netlify, COMMIT_REF é o commit do build; fora dele, cai no git local.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

function commitDoGit() {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

export function dadosDaVersao(app, env = process.env) {
  return {
    app,
    sha: env.COMMIT_REF || commitDoGit() || "desconhecido",
    builtAt: new Date().toISOString(),
  };
}

/** Plugin do Vite que publica /version.json junto com o build. */
export function versaoPlugin(app) {
  return {
    name: "sysbelt-versao",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: `${JSON.stringify(dadosDaVersao(app), null, 2)}\n`,
      });
    },
  };
}

// node scripts/versaoBuild.mjs <app> <arquivo-de-saida>
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [app, saida] = process.argv.slice(2);
  if (!app || !saida) {
    console.error("Uso: node scripts/versaoBuild.mjs <app> <arquivo-de-saida>");
    process.exit(1);
  }
  mkdirSync(dirname(saida), { recursive: true });
  writeFileSync(saida, `${JSON.stringify(dadosDaVersao(app), null, 2)}\n`);
  console.log(`Versão gravada em ${saida}`);
}
