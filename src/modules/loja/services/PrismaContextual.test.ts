import { describe, expect, it, vi } from "vitest";

const { findMany, prismaDaRequisicao } = vi.hoisted(() => {
  const findMany = vi.fn();
  return { findMany, prismaDaRequisicao: vi.fn(() => ({ produto: { findMany } })) };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ListProdutosService } from "./ListProdutosService";

describe("loja com tenant", () => {
  it("consulta o Prisma associado à requisição", async () => {
    findMany.mockResolvedValue([]);
    await expect(new ListProdutosService().execute(1)).resolves.toEqual([]);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
  });
});
