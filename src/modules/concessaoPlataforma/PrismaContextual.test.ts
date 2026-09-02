import { describe, expect, it, vi } from "vitest";

const { findUnique, findUnidade, prismaDaRequisicao } = vi.hoisted(() => {
  const findUnique = vi.fn();
  const findUnidade = vi.fn();
  return {
    findUnique, findUnidade,
    prismaDaRequisicao: vi.fn(() => ({ unidade: { findUnique: findUnidade }, concessaoPlataforma: { findUnique } })),
  };
});

vi.mock("../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { tenantTemRecurso } from "./recursos";

describe("concessão com tenant", () => {
  it("consulta a concessão da conta da unidade", async () => {
    findUnidade.mockResolvedValue({ contaId: 8 });
    findUnique.mockResolvedValue(null);
    await expect(tenantTemRecurso("CONTROLE_ACESSO", new Date(), undefined, 3)).resolves.toBe(false);
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledWith({ where: { contaId: 8 } });
  });
});
