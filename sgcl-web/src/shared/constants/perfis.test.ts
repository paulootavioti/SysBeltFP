import { describe, expect, it } from "vitest";

// `?raw` do Vite traz o arquivo como texto. É como este teste alcança o
// backend sem `node:fs` — que exigiria `@types/node` só por causa dele.
import fonteDoBackend from "../../../../src/shared/constants/perfis.ts?raw";

import { PERFIS, PERFIS_MULTI_UNIDADE, PERFIS_QUE_VEEM_TODAS } from "./perfis";

// Frontend e API são pacotes npm separados: a lista de perfis daqui é um
// espelho da de lá, e espelho diverge calado. Divergiu — quando o DONO entrou
// na lista do backend, a cópia do frontend ficou para trás e o seletor de
// unidade sumiu da tela para o único perfil que precisa dele.
//
// Este teste lê o arquivo do backend e compara. Não é elegante ler fonte de
// outro projeto, mas é o único ponto onde a divergência é observável — e ela
// custou um defeito em produção que a suíte inteira deixou passar.
//
// Se um dia os dois virarem um pacote compartilhado, este teste sai junto.

function listaDoBackend(nome: string): string[] {
  const trecho = new RegExp(`${nome}[^=]*=\\s*\\[([^\\]]*)\\]`).exec(fonteDoBackend);

  if (!trecho) {
    throw new Error(
      `Não achei \`${nome}\` em src/shared/constants/perfis.ts. Se a constante ` +
        "mudou de nome ou de formato, ajuste este teste junto."
    );
  }

  return [...trecho[1].matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
}

describe("perfis espelhados do backend", () => {
  it("a lista de papéis é a mesma", () => {
    expect([...PERFIS].sort()).toEqual(listaDoBackend("PERFIS").sort());
  });

  it("quem alterna de unidade é o mesmo", () => {
    expect([...PERFIS_MULTI_UNIDADE].sort()).toEqual(
      listaDoBackend("PERFIS_MULTI_UNIDADE").sort()
    );
  });

  // Confere que a leitura do arquivo funciona de verdade. Sem isto, um regex
  // que parasse de casar devolveria lista vazia e os testes acima passariam
  // comparando nada com nada.
  it("está mesmo lendo o backend", () => {
    expect(listaDoBackend("PERFIS")).toContain("DONO");
    expect(listaDoBackend("PERFIS").length).toBeGreaterThan(1);
  });
});

describe("quem vê todas as unidades", () => {
  // Não tem contraparte no backend: lá a regra aparece como ausência de
  // unidade ativa, não como lista de perfis. Fica pinado aqui.
  it("é só o DONO", () => {
    expect(PERFIS_QUE_VEEM_TODAS).toEqual(["DONO"]);
  });

  it("é um subconjunto de quem alterna de unidade", () => {
    for (const perfil of PERFIS_QUE_VEEM_TODAS) {
      expect(PERFIS_MULTI_UNIDADE).toContain(perfil);
    }
  });
});
