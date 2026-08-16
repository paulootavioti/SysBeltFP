import { describe, expect, it, vi } from "vitest";

const { findUnique, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return {
    findUnique,
    prismaDaRequisicao: vi.fn(() => ({ concessaoPlataforma: { findUnique } })),
  };
});

vi.mock("../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { tenantTemRecurso } from "./recursos";

describe("concessão com tenant", () => {
  it("consulta a concessão no Prisma da requisição", async () => {
    findUnique.mockResolvedValue(null);
    await expect(tenantTemRecurso("CONTROLE_ACESSO")).resolves.toBe(false);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledOnce();
  });
});
