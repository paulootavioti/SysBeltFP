import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, count, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  const count = vi.fn();
  return {
    findMany,
    count,
    prismaDaRequisicao: vi.fn(() => ({
      lead: { findMany, count },
      $transaction: (operacoes: Promise<unknown>[]) => Promise.all(operacoes),
    })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListLeadsService } from "./ListLeadsService";

describe("serviços de leads com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    await new ListLeadsService().execute(1);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
    expect(count).toHaveBeenCalledOnce();
  });
});
