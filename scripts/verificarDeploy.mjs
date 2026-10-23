// Confere se cada site publicado saiu do commit esperado (por padrão, a
// origin/main) e se a API aceita, via CORS, os portais que a consomem.
//
// Os três frontends são sites separados no Netlify: um deploy que falha em
// um deles deixa aquele site servindo a versão anterior sem nenhum aviso.
// Este script é a prova de que os quatro estão no mesmo commit.
//
//   git fetch origin main && npm run deploy:verificar
//   npm run deploy:verificar -- --sha <commit>
//
// As URLs padrão são as dos sites em docs/deploy.md; cada uma pode ser
// trocada por variável de ambiente (ex.: URL_PORTAL_PROFESSOR=https://...).

import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const URL_SITE_PRINCIPAL = process.env.URL_SITE_PRINCIPAL ?? "https://sysbeltfp.netlify.app";
const URL_PORTAL_FAMILIA = process.env.URL_PORTAL_FAMILIA ?? "https://sysbeltportalfamilia.netlify.app";
const URL_PORTAL_PROFESSOR = process.env.URL_PORTAL_PROFESSOR ?? "https://portalprofessorsysbelt.netlify.app";
const URL_API = process.env.URL_API ?? `${URL_SITE_PRINCIPAL}/api`;

const ALVOS = [
  { nome: "API", url: `${URL_API}/version` },
  { nome: "sgcl-web", url: `${URL_SITE_PRINCIPAL}/version.json` },
  { nome: "Portal da Família", url: `${URL_PORTAL_FAMILIA}/version.json` },
  { nome: "Portal do Professor", url: `${URL_PORTAL_PROFESSOR}/version.json` },
];

// Portais em outro domínio: dependem de CORS para falar com a API.
const ORIGENS_CORS = [URL_PORTAL_FAMILIA, URL_PORTAL_PROFESSOR];

async function lerJson(url) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { "cache-control": "no-cache" } });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

export async function verificarVersao(alvo, shaEsperado) {
  try {
    const { sha } = await lerJson(alvo.url);
    if (sha === shaEsperado) return { ok: true, mensagem: `${alvo.nome}: ${sha.slice(0, 7)}` };
    return { ok: false, mensagem: `${alvo.nome}: publicado ${String(sha).slice(0, 7)}, esperado ${shaEsperado.slice(0, 7)}` };
  } catch (erro) {
    return { ok: false, mensagem: `${alvo.nome}: sem versão em ${alvo.url} (${erro.message})` };
  }
}

export async function verificarCors(origem) {
  try {
    const resposta = await fetch(`${URL_API}/health`, {
      method: "OPTIONS",
      headers: { Origin: origem, "Access-Control-Request-Method": "GET" },
      signal: AbortSignal.timeout(15_000),
    });
    const liberada = resposta.headers.get("access-control-allow-origin");
    if (liberada === origem) return { ok: true, mensagem: `CORS ${origem}: liberado` };
    return { ok: false, mensagem: `CORS ${origem}: bloqueado — inclua a origem em CORS_ORIGIN do site da API` };
  } catch (erro) {
    return { ok: false, mensagem: `CORS ${origem}: falhou (${erro.message})` };
  }
}

function argumento(nome) {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice >= 0 ? process.argv[indice + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const shaEsperado = argumento("sha") ?? execSync("git rev-parse origin/main").toString().trim();
  console.log(`Commit esperado: ${shaEsperado}\n`);

  const resultados = await Promise.all([
    ...ALVOS.map((alvo) => verificarVersao(alvo, shaEsperado)),
    ...ORIGENS_CORS.map(verificarCors),
  ]);

  for (const { ok, mensagem } of resultados) console.log(`${ok ? "✅" : "❌"} ${mensagem}`);

  if (resultados.some((resultado) => !resultado.ok)) {
    console.error("\nDeploy divergente: veja os itens marcados acima.");
    process.exit(1);
  }
  console.log("\nTodos os sites estão no commit esperado.");
}
