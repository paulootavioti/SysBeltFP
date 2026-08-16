import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ_SRC = join(process.cwd(), "src");
const IMPORT_GLOBAL = /from\s+["'][^"']*\/database\/prisma["']/;

function arquivosTypeScript(diretorio: string): string[] {
  return readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(diretorio, entrada.name);
    if (entrada.isDirectory()) return arquivosTypeScript(caminho);
    return entrada.isFile() && entrada.name.endsWith(".ts") ? [caminho] : [];
  });
}

describe("fronteira de banco por tenant", () => {
  it("proíbe o Prisma global no código de produção", () => {
    const infracoes = arquivosTypeScript(RAIZ_SRC)
      .filter((arquivo) => !arquivo.endsWith(".test.ts"))
      .filter((arquivo) => !arquivo.includes("/shared/testing/"))
      .filter((arquivo) => !arquivo.endsWith("/shared/database/prisma.ts"))
      .filter((arquivo) => IMPORT_GLOBAL.test(readFileSync(arquivo, "utf8")))
      .map((arquivo) => relative(process.cwd(), arquivo));

    expect(infracoes).toEqual([]);
  });
});
