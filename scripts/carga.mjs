// Roda o teste de carga (tests/load/smoke.js) recusando produção.
//
//   BASE_URL=http://localhost:3333 LOGIN_EMAIL=... LOGIN_SENHA=... npm run carga
//
// Usa o k6 instalado; sem ele, o Docker (imagem grafana/k6). A carga cria
// e apaga registros e disputa o banco com as academias: nunca em produção.
// Ver docs/teste-carga.md.

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Domínios que atendem academias de verdade. Acrescente aqui um domínio
// próprio quando for adotado.
export const HOSTS_DE_PRODUCAO = ["sysbeltfp.netlify.app", "sysbeltportalfamilia.netlify.app", "portalprofessorsysbelt.netlify.app"];

export function ehProducao(url, extras = []) {
  const host = new URL(url).hostname.toLowerCase();
  return [...HOSTS_DE_PRODUCAO, ...extras].some((proibido) => host === proibido.toLowerCase());
}

function disponivel(comando) {
  return !spawnSync(comando, ["version"], { stdio: "ignore" }).error;
}

function main() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    console.error("Defina BASE_URL (ex.: http://localhost:3333).");
    process.exit(1);
  }
  const extras = (process.env.HOSTS_DE_PRODUCAO_EXTRAS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  if (ehProducao(baseUrl, extras)) {
    console.error(`Recusado: ${new URL(baseUrl).hostname} é produção. Use o ambiente de homologação (docs/teste-carga.md).`);
    process.exit(1);
  }

  const argumentos = process.argv.slice(2);
  let resultado;
  if (disponivel("k6")) {
    resultado = spawnSync("k6", ["run", ...argumentos, "tests/load/smoke.js"], { stdio: "inherit" });
  } else if (disponivel("docker")) {
    // localhost do host não é o localhost do contêiner: usa a rede do host.
    const variaveis = Object.keys(process.env)
      .filter((nome) => ["BASE_URL", "LOGIN_EMAIL", "LOGIN_SENHA", "TOKEN_DE_TESTE", "TURMA_ID", "FORMA_PAGAMENTO_ID", "VUS", "DURACAO"].includes(nome))
      .flatMap((nome) => ["-e", nome]);
    resultado = spawnSync("docker", [
      "run", "--rm", "--network=host", ...variaveis,
      "-v", `${process.cwd()}/tests/load:/scripts:ro`,
      "grafana/k6", "run", ...argumentos, "/scripts/smoke.js",
    ], { stdio: "inherit" });
  } else {
    console.error("Instale o k6 (brew install k6) ou o Docker.");
    process.exit(1);
  }
  process.exit(resultado.status ?? 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
