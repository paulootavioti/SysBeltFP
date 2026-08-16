import { describe, expect, it, vi } from "vitest";

const { unidadeFindMany, alunoUnidadeGroupBy, prismaDaRequisicao } = vi.hoisted(() => ({
  unidadeFindMany: vi.fn(), alunoUnidadeGroupBy: vi.fn(), prismaDaRequisicao: vi.fn(),
}));
prismaDaRequisicao.mockReturnValue({ unidade: { findMany: unidadeFindMany }, alunoUnidade: { groupBy: alunoUnidadeGroupBy } });
vi.mock("../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { GerarSnapshotContagemService } from "./GerarSnapshotContagemService";

describe("snapshot do control-plane com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    unidadeFindMany.mockResolvedValue([]); alunoUnidadeGroupBy.mockResolvedValue([]);
    const resultado = await new GerarSnapshotContagemService().execute("tenant-1", new Date("2026-08-16T12:00:00Z"));
    expect(resultado.unidades).toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledTimes(2);
  });
});
