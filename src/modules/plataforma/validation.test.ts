import { describe, expect, it } from "vitest";

import { planoPlataformaSchema } from "./validation";

const base = { nome: "Essencial", alunosPorBloco: 10 };

function validar(precoPorBlocoCentavos: number) {
  return planoPlataformaSchema.safeParse({ ...base, precoPorBlocoCentavos }).success;
}

describe("preço do plano em centavos", () => {
  it("aceita o preço de venda escrito certo", () => {
    expect(validar(3700)).toBe(true); // R$ 37,00
    expect(validar(5900)).toBe(true); // R$ 59,00
  });

  it("recusa reais escritos no lugar de centavos", () => {
    // este é o erro que importa: 37 seria aceito como R$ 0,37 e o cliente
    // pagaria cem vezes menos sem ninguém perceber. Em JSON, 37.0 chega
    // como o inteiro 37, então `int()` sozinho deixaria passar.
    expect(validar(37)).toBe(false);
    expect(validar(37.0)).toBe(false);
    expect(validar(59)).toBe(false);
    expect(validar(99)).toBe(false);
  });

  it("recusa valor fracionário e negativo", () => {
    expect(validar(3700.5)).toBe(false);
    expect(validar(-3700)).toBe(false);
  });

  it("a mensagem explica a unidade em vez de só dizer 'inválido'", () => {
    const resultado = planoPlataformaSchema.safeParse({ ...base, precoPorBlocoCentavos: 37 });

    expect(resultado.success).toBe(false);
    expect(JSON.stringify(resultado.error?.issues)).toContain("3700");
  });
});

describe("faixa de alunos", () => {
  it("exige faixa inteira e positiva", () => {
    expect(planoPlataformaSchema.safeParse({ ...base, precoPorBlocoCentavos: 3700 }).success).toBe(
      true
    );
    expect(
      planoPlataformaSchema.safeParse({ nome: "X", alunosPorBloco: 0, precoPorBlocoCentavos: 3700 })
        .success
    ).toBe(false);
    expect(
      planoPlataformaSchema.safeParse({
        nome: "X",
        alunosPorBloco: 10.5,
        precoPorBlocoCentavos: 3700,
      }).success
    ).toBe(false);
  });
});

describe("recursos do plano", () => {
  it("aceita recurso conhecido e recusa desconhecido", () => {
    expect(
      planoPlataformaSchema.safeParse({
        ...base,
        precoPorBlocoCentavos: 3700,
        recursos: ["WHATSAPP", "CONTROLE_ACESSO"],
      }).success
    ).toBe(true);

    expect(
      planoPlataformaSchema.safeParse({
        ...base,
        precoPorBlocoCentavos: 3700,
        recursos: ["WHATSAP"],
      }).success
    ).toBe(false);
  });
});
