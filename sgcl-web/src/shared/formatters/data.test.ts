import { describe, expect, it } from "vitest";

import { calcularIdade } from "./data";

describe("calcularIdade", () => {
  it("retorna null quando não há data de nascimento", () => {
    expect(calcularIdade("")).toBeNull();
  });

  it("calcula a idade quando o aniversário do ano já passou", () => {
    const hoje = new Date();
    const nascimento = new Date(hoje.getFullYear() - 10, hoje.getMonth(), hoje.getDate() - 1);
    expect(calcularIdade(nascimento.toISOString())).toBe(10);
  });

  it("desconta um ano quando o aniversário ainda não chegou", () => {
    const hoje = new Date();
    const nascimento = new Date(hoje.getFullYear() - 10, hoje.getMonth(), hoje.getDate() + 1);
    expect(calcularIdade(nascimento.toISOString())).toBe(9);
  });
});
