import { describe, expect, it, vi } from "vitest";

const { contaFindMany, alunoGroupBy, unidadeFindMany, prismaDaRequisicao } = vi.hoisted(() => ({
  contaFindMany: vi.fn(), alunoGroupBy: vi.fn(), unidadeFindMany: vi.fn(), prismaDaRequisicao: vi.fn(),
}));
prismaDaRequisicao.mockReturnValue({ conta: { findMany: contaFindMany }, aluno: { groupBy: alunoGroupBy }, unidade: { findMany: unidadeFindMany } });
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { ListContasService } from "./ListContasService";

describe("contas da plataforma com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    contaFindMany.mockResolvedValue([]); alunoGroupBy.mockResolvedValue([]); unidadeFindMany.mockResolvedValue([]);
    await expect(new ListContasService().execute()).resolves.toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
