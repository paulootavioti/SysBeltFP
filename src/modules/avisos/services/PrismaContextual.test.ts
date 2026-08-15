import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn().mockResolvedValue([]);
  return {
    findMany,
    prismaDaRequisicao: vi.fn(() => ({
      mensalidade: { findMany },
      pedido: { findMany },
      avisoReconhecido: { findMany },
    })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListAvisosService } from "./ListAvisosService";

describe("serviços de avisos com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta somente o Prisma associado à requisição", async () => {
    await new ListAvisosService().execute(1, 1);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledTimes(3);
  });
});
