import { describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return { findUnique, prismaDaRequisicao: vi.fn(() => ({ competicao: { findUnique } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { DeleteCompeticaoService } from "./DeleteCompeticaoService";

describe("competições com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findUnique.mockResolvedValue(null);
    await expect(new DeleteCompeticaoService().execute(1, 1)).rejects.toThrow("Competição não encontrada.");
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledOnce();
  });
});
