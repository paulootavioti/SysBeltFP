import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return {
    findMany,
    prismaDaRequisicao: vi.fn(() => ({ plano: { findMany } })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListPlanosService } from "./ListPlanosService";

describe("serviços de planos com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await new ListPlanosService().execute(1);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
