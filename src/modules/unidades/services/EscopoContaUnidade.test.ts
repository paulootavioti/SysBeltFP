import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, update, prismaDaRequisicao } = vi.hoisted(() => {
  const findFirst = vi.fn();
  const update = vi.fn();
  return {
    findFirst,
    update,
    prismaDaRequisicao: vi.fn(() => ({ unidade: { findFirst, update } })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));

import { UpdateUnidadeService } from "./UpdateUnidadeService";
import { ToggleAtivoUnidadeService } from "./ToggleAtivoUnidadeService";

describe("fronteira da conta na gestão de unidades", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não atualiza unidade de outro assinante", async () => {
    findFirst.mockResolvedValue(null);

    await expect(new UpdateUnidadeService().execute(9, 42, { nome: "Filial" })).rejects.toMatchObject({
      message: "Unidade não encontrada.",
    });

    expect(findFirst).toHaveBeenCalledWith({ where: { id: 9, contaId: 42 } });
    expect(update).not.toHaveBeenCalled();
  });

  it("não altera o status de unidade de outro assinante", async () => {
    findFirst.mockResolvedValue(null);

    await expect(new ToggleAtivoUnidadeService().execute(9, 42)).rejects.toMatchObject({
      message: "Unidade não encontrada.",
    });

    expect(findFirst).toHaveBeenCalledWith({ where: { id: 9, contaId: 42 } });
    expect(update).not.toHaveBeenCalled();
  });
});
