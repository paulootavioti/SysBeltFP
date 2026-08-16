import { describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ mensalidade: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { GetContasAReceberService } from "./GetContasAReceberService";

describe("financeiro com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await expect(new GetContasAReceberService().execute(1)).resolves.toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledOnce();
  });
});
