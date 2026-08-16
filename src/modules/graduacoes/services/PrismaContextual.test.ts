import { describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return { findUnique, prismaDaRequisicao: vi.fn(() => ({ aluno: { findUnique } })) };
});
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { GetEvolucaoAlunoService } from "./GetEvolucaoAlunoService";

describe("graduações com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findUnique.mockResolvedValue(null);
    await expect(new GetEvolucaoAlunoService().execute(1, 1)).rejects.toThrow("Aluno não encontrado.");
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
