import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return {
    findMany,
    prismaDaRequisicao: vi.fn(() => ({ formaPagamento: { findMany } })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListFormasPagamentoService } from "./ListFormasPagamentoService";

describe("serviços de formas de pagamento com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await new ListFormasPagamentoService().execute(1);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
