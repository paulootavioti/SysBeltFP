import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return {
    findUnique,
    prismaDaRequisicao: vi.fn(() => ({ fotoTreino: { findUnique } })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ExcluirFotoTreinoService } from "./ExcluirFotoTreinoService";

describe("fotos de treino com tenant", () => {
  beforeEach(() => vi.clearAllMocks());
  it("consulta o Prisma associado à requisição", async () => {
    findUnique.mockResolvedValue(null);
    await expect(new ExcluirFotoTreinoService().execute(1, {
      id: 1, perfil: "ADMIN", unidadeId: 1,
    })).rejects.toThrow("Foto não encontrada.");
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledOnce();
  });
});
