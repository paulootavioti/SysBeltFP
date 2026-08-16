import { beforeEach, describe, expect, it, vi } from "vitest";

const { count, prismaDaRequisicao } = vi.hoisted(() => {
  const count = vi.fn().mockResolvedValue(0);
  return {
    count,
    prismaDaRequisicao: vi.fn(() => ({
      mensalidade: { count }, contrato: { count }, mensagemFamilia: { count },
      pedido: { count }, aluno: { findMany: vi.fn().mockResolvedValue([]) },
      aulaAluno: { groupBy: vi.fn().mockResolvedValue([]) },
    })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { GetContadoresMenuService } from "./GetContadoresMenuService";

describe("notificações com tenant", () => {
  beforeEach(() => vi.clearAllMocks());
  it("usa o mesmo Prisma contextual nos contadores e graduações", async () => {
    await new GetContadoresMenuService().execute(1);
    expect(prismaDaRequisicao).toHaveBeenCalledTimes(2);
    expect(count).toHaveBeenCalledTimes(4);
  });
});
