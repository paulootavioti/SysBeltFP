import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, prismaDaRequisicao } = vi.hoisted(() => {
  const findFirst = vi.fn();
  return {
    findFirst,
    prismaDaRequisicao: vi.fn(() => ({ consentimento: { findFirst } })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { ConsultarConsentimentoService } from "./ConsultarConsentimentoService";

describe("serviços de consentimento com tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o Prisma associado à requisição", async () => {
    findFirst.mockResolvedValue(null);
    await new ConsultarConsentimentoService().situacaoAtual(1, "USO_IMAGEM");
    expect(prismaDaRequisicao).toHaveBeenCalledOnce();
    expect(findFirst).toHaveBeenCalledOnce();
  });
});
