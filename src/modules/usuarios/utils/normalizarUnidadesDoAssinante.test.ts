import { beforeEach, describe, expect, it, vi } from "vitest";

const { contaDaUnidade, garantirUnidadesDaMesmaConta } = vi.hoisted(() => ({
  contaDaUnidade: vi.fn(),
  garantirUnidadesDaMesmaConta: vi.fn(),
}));

vi.mock("../../../shared/utils/contaDoUsuario", () => ({
  contaDaUnidade,
  garantirUnidadesDaMesmaConta,
}));

import { normalizarUnidadesDoAssinante } from "./normalizarUnidadesDoAssinante";

describe("vínculos de unidades gerenciados pelo assinante", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normaliza e aceita filiais da mesma academia", async () => {
    contaDaUnidade.mockResolvedValue(7);
    garantirUnidadesDaMesmaConta.mockResolvedValue(7);

    await expect(normalizarUnidadesDoAssinante([3, "4", 3], 3)).resolves.toEqual([3, 4]);
  });

  it("recusa filial de outro assinante", async () => {
    contaDaUnidade.mockResolvedValue(7);
    garantirUnidadesDaMesmaConta.mockResolvedValue(8);

    await expect(normalizarUnidadesDoAssinante([9], 3)).rejects.toMatchObject({
      message: "Uma ou mais unidades não pertencem à sua academia.",
      statusCode: 403,
    });
  });

  it("ignora o campo quando ele não foi enviado", async () => {
    await expect(normalizarUnidadesDoAssinante(undefined, 3)).resolves.toBeUndefined();
    expect(contaDaUnidade).not.toHaveBeenCalled();
  });
});
