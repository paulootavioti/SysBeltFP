// Confere se todo src/href local das landings aponta para um arquivo que
// existe. As landings são HTML estático publicado direto pelo Netlify: um
// arquivo renomeado vira imagem quebrada ou CSS ausente em produção, sem
// nenhum build para avisar antes.
//
// Sem dependência nova: lê os HTMLs com regex, o suficiente para atributos
// src/href escritos à mão.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PAGINAS = ["landing/index.html", "landing-academia/index.html", "landing-academia/captacao.html"];

// externos, âncoras e esquemas que não são arquivo
const NAO_E_ARQUIVO = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

export function referenciasLocais(html) {
  const referencias = [];
  for (const [, valor] of html.matchAll(/\s(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const caminho = valor.split(/[?#]/)[0].trim();
    if (!caminho || NAO_E_ARQUIVO.test(valor)) continue;
    referencias.push(caminho);
  }
  return referencias;
}

export function verificarPagina(pagina) {
  const html = readFileSync(pagina, "utf8");
  const pasta = dirname(pagina);
  return referenciasLocais(html)
    .filter((caminho) => {
      // caminho absoluto ("/img/x.png") é relativo à raiz publicada da landing
      const alvo = caminho.startsWith("/") ? resolve(pasta, `.${caminho}`) : resolve(pasta, caminho);
      return !existsSync(alvo) && !existsSync(resolve(alvo, "index.html"));
    })
    .map((caminho) => `${pagina}: ${caminho}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const quebrados = PAGINAS.flatMap(verificarPagina);
  if (quebrados.length > 0) {
    console.error(`Referências locais quebradas:\n${quebrados.map((item) => `  - ${item}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`Assets das landings conferidos (${PAGINAS.length} páginas).`);
}
