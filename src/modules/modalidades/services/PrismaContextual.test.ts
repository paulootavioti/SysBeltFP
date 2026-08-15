import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return {
    findMany,
    prismaDaRequisicao: vi.fn(() => ({ modalidade: { findMany } })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListModalidadesService } from "./ListModalidadesService";

describe("serviços de modalidades com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await new ListModalidadesService().execute(1);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
