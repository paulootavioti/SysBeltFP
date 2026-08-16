import { describe, expect, it, vi } from "vitest";

const { findMany, findFirst, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  return { findMany, findFirst, prismaDaRequisicao: vi.fn(() => ({ aulaProgramada: { findMany, findFirst } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { GetAulasHojeProfessorService } from "./GetAulasHojeProfessorService";

describe("portal do professor com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    findFirst.mockResolvedValue(null);
    const resultado = await new GetAulasHojeProfessorService().execute({ id: 1, perfil: "PROFESSOR", unidadeId: 1 });
    expect(resultado).toEqual({ proximaAula: null, outrasHoje: [], proximaSemana: null });
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
