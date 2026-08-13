import { describe, expect, it } from "vitest";

import { alunoSchema } from "./validation";

const alunoMinimo = { nome: "Ana", dataNascimento: "2015-01-10" };

describe("contrato de unidades permitidas do aluno", () => {
  it("aceita uma lista de ids de unidades", () => {
    expect(alunoSchema.safeParse({
      ...alunoMinimo,
      unidadesPermitidasIds: [1, 2],
    }).success).toBe(true);
  });

  it("recusa ids inválidos e listas excessivas", () => {
    expect(alunoSchema.safeParse({
      ...alunoMinimo,
      unidadesPermitidasIds: [0],
    }).success).toBe(false);
    expect(alunoSchema.safeParse({
      ...alunoMinimo,
      unidadesPermitidasIds: Array.from({ length: 101 }, (_, indice) => indice + 1),
    }).success).toBe(false);
  });
});
