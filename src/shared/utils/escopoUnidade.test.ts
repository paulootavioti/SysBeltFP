import { describe, expect, it } from "vitest";

import { escopoUnidade, garantirAcessoUnidade } from "./escopoUnidade";

describe("escopo operacional fail-closed", () => {
  it("usa um identificador impossível quando não há unidade ativa", () => {
    expect(escopoUnidade(null)).toEqual({ unidadeId: -1 });
  });

  it("não transforma unidade nula em acesso global", () => {
    expect(() => garantirAcessoUnidade(null, 10)).toThrow("Registro não encontrado.");
  });
});
