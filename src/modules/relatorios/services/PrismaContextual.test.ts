import { describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ aluno: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { RelatorioAniversariantesService } from "./RelatorioAniversariantesService";

describe("relatórios com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    const resultado = await new RelatorioAniversariantesService().execute(1);
    expect(resultado.totalAniversariantes).toBe(0);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
