import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, prismaDaRequisicao } = vi.hoisted(() => {
  const create = vi.fn();
  return { create, prismaDaRequisicao: vi.fn(() => ({ meta: { create } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { CreateMetaService } from "./CreateMetaService";

describe("serviços de metas com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("grava no Prisma associado à requisição", async () => {
    create.mockResolvedValue({ id: 1 });
    await new CreateMetaService().execute({
      unidadeId: 1, nome: "Meta", tipo: "RECEITA", valorMeta: 100,
      formatoValor: "MOEDA", dataLimite: "2026-12-31",
    });
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledOnce();
  });
});
