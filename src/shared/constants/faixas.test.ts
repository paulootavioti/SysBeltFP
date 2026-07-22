import { describe, expect, it } from "vitest";

import {
  calcularIdade,
  getFaixasDaTrilha,
  getTrilhaFaixa,
  REGRAS_FAIXA_JUVENIL_ADULTO,
} from "./faixas";

function dataHaAnosAtras(anos: number, ajusteDias = 0): Date {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  data.setDate(data.getDate() + ajusteDias);
  return data;
}

describe("calcularIdade", () => {
  it("calcula a idade quando o aniversário do ano já passou", () => {
    expect(calcularIdade(dataHaAnosAtras(10, -1))).toBe(10);
  });

  it("desconta um ano quando o aniversário ainda não chegou", () => {
    expect(calcularIdade(dataHaAnosAtras(10, 1))).toBe(9);
  });
});

describe("getTrilhaFaixa", () => {
  it("classifica até 14 anos como INFANTIL", () => {
    expect(getTrilhaFaixa(14)).toBe("INFANTIL");
  });

  it("classifica a partir de 15 anos como JUVENIL_ADULTO", () => {
    expect(getTrilhaFaixa(15)).toBe("JUVENIL_ADULTO");
  });
});

describe("getFaixasDaTrilha", () => {
  it("retorna a lista de faixas infantis para a trilha INFANTIL", () => {
    expect(getFaixasDaTrilha("INFANTIL")).toContain("Verde");
    expect(getFaixasDaTrilha("INFANTIL")).not.toContain("Preta");
  });

  it("retorna a lista de faixas adultas para a trilha JUVENIL_ADULTO", () => {
    expect(getFaixasDaTrilha("JUVENIL_ADULTO")).toEqual(["Branca", "Azul", "Roxa", "Marrom", "Preta"]);
  });
});

describe("REGRAS_FAIXA_JUVENIL_ADULTO", () => {
  it("exige 16 anos para faixa Azul, sem tempo mínimo", () => {
    expect(REGRAS_FAIXA_JUVENIL_ADULTO.Azul).toEqual({ idadeMinima: 16 });
  });

  it("exige 19 anos para faixa Preta", () => {
    expect(REGRAS_FAIXA_JUVENIL_ADULTO.Preta.idadeMinima).toBe(19);
  });
});
