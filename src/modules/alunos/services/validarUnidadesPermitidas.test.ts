import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { validarUnidadesPermitidas } from "./validarUnidadesPermitidas";

vi.mock("../../../shared/database/prisma", () => ({
  prisma: {
    unidade: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

const unidade = prisma.unidade as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
};

describe("unidades permitidas do aluno", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unidade.findUnique.mockResolvedValue({ contaId: 10, ativo: true });
  });

  it("inclui a unidade principal e remove repetições", async () => {
    unidade.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await expect(validarUnidadesPermitidas(1, [2, 2])).resolves.toEqual([1, 2]);
    expect(unidade.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] }, contaId: 10, ativo: true },
      select: { id: true },
    });
  });

  it("rejeita unidade de outra academia ou inativa", async () => {
    unidade.findMany.mockResolvedValue([{ id: 1 }]);

    await expect(validarUnidadesPermitidas(1, [99])).rejects.toThrow(
      "Todas as unidades permitidas devem estar ativas e pertencer à mesma academia.",
    );
  });

  it("rejeita quando a própria unidade principal está inativa", async () => {
    unidade.findUnique.mockResolvedValue({ contaId: 10, ativo: false });

    await expect(validarUnidadesPermitidas(1, [])).rejects.toThrow(
      "Unidade principal não está ativa.",
    );
    expect(unidade.findMany).not.toHaveBeenCalled();
  });
});
