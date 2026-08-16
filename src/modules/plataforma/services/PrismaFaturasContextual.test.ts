import { describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return { findUnique, prismaDaRequisicao: vi.fn(() => ({ faturaPlataforma: { findUnique } })) };
});
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { MarcarFaturaPagaService } from "./MarcarFaturaPagaService";

describe("faturas da plataforma com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findUnique.mockResolvedValue(null);
    await expect(new MarcarFaturaPagaService().execute(1)).rejects.toThrow("Fatura não encontrada.");
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
