import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ tecnica: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListTecnicasService } from "./ListTecnicasService";

describe("serviços de técnicas com tenant", () => {
  beforeEach(() => vi.clearAllMocks());
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await new ListTecnicasService().execute(1);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
