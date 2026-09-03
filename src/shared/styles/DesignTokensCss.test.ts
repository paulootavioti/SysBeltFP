import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = process.cwd();
const ignorados = new Set([".git", "node_modules", "dist", "coverage"]);
const declaracaoToken = /^\s*--(?:color-|font-|space-|radius-|shadow-|tap-target-min\s*:|layout-)[\w-]*\s*:/m;

function arquivosCss(diretorio: string): string[] {
  return readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    if (ignorados.has(entrada.name)) return [];
    const caminho = join(diretorio, entrada.name);
    if (entrada.isDirectory()) return arquivosCss(caminho);
    return entrada.isFile() && entrada.name.endsWith(".css") ? [caminho] : [];
  });
}

describe("fonte única dos design tokens", () => {
  it("não declara tokens fora de packages/design-tokens", () => {
    const infracoes = arquivosCss(raiz)
      .filter((arquivo) => !arquivo.includes("/packages/design-tokens/"))
      .filter((arquivo) => declaracaoToken.test(readFileSync(arquivo, "utf8")))
      .map((arquivo) => relative(raiz, arquivo));

    expect(infracoes).toEqual([]);
  });
});
