import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const findFirst = vi.fn();
const updateConsentimento = vi.fn();
const updateAluno = vi.fn();
const createAudit = vi.fn();
const transaction = vi.fn(async (callback) => callback({
  consentimento: { update: updateConsentimento },
  aluno: { update: updateAluno },
  auditLog: { create: createAudit },
}));

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({
  prismaDaRequisicao: () => ({
    consentimento: { findMany, findFirst },
    $transaction: transaction,
  }),
}));

import { PrivacidadeFamiliaService } from "./PrivacidadeFamiliaService";

describe("privacidade no Portal da Família", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista somente os consentimentos do aluno solicitado", async () => {
    findMany.mockResolvedValue([{ id: 1 }]);
    await expect(new PrivacidadeFamiliaService().listar(42)).resolves.toEqual([{ id: 1 }]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { alunoId: 42 } }));
  });

  it("recusa revogar consentimento fora do escopo da sessão", async () => {
    findFirst.mockResolvedValue(null);
    await expect(new PrivacidadeFamiliaService().revogar(9, [1, 2])).rejects.toThrow("Consentimento não encontrado");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("revoga uso de imagem, atualiza o aluno e registra auditoria", async () => {
    findFirst.mockResolvedValue({ id: 9, alunoId: 2, unidadeId: 3, tipo: "USO_IMAGEM" });
    updateConsentimento.mockResolvedValue({ id: 9, revogadoEm: new Date() });
    await new PrivacidadeFamiliaService().revogar(9, [2]);
    expect(updateAluno).toHaveBeenCalledWith({ where: { id: 2 }, data: { autorizaUsoImagem: false } });
    expect(createAudit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ origemSistema: "portal-familia" }) }));
  });
});
