import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ unidade: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListUnidadesService } from "./ListUnidadesService";

describe("serviços de unidades com tenant", () => {
  beforeEach(() => vi.clearAllMocks());
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await new ListUnidadesService().execute();
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
