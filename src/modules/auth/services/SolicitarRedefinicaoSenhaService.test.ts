import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, updateMany, create, transaction, prismaDaRequisicao } = vi.hoisted(() => {
  const findFirst = vi.fn();
  const updateMany = vi.fn(() => ({ operacao: "invalidar" }));
  const create = vi.fn(() => ({ operacao: "criar" }));
  const transaction = vi.fn();
  return {
    findFirst, updateMany, create, transaction,
    prismaDaRequisicao: vi.fn(() => ({
      usuario: { findFirst },
      tokenRedefinicaoSenha: { updateMany, create },
      $transaction: transaction,
    })),
  };
});

vi.mock("../../../shared/database/prismaDaRequisicao", () => ({ prismaDaRequisicao }));
import { SolicitarRedefinicaoSenhaService } from "./SolicitarRedefinicaoSenhaService";

describe("solicitação de redefinição da equipe", () => {
  const emailService = { enviar: vi.fn() };

  beforeEach(() => vi.clearAllMocks());

  it("não revela quando o e-mail não existe", async () => {
    findFirst.mockResolvedValue(null);
    await expect(new SolicitarRedefinicaoSenhaService(emailService).execute("ausente@exemplo.com", "EQUIPE")).resolves.toBeUndefined();
    expect(create).not.toHaveBeenCalled();
    expect(emailService.enviar).not.toHaveBeenCalled();
  });

  it("invalida tokens anteriores e envia um link de uso único", async () => {
    findFirst.mockResolvedValue({ id: 7, email: "pessoa@exemplo.com" });
    await new SolicitarRedefinicaoSenhaService(emailService).execute("Pessoa@Exemplo.com", "EQUIPE");

    expect(transaction).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tipo: "EQUIPE", email: "pessoa@exemplo.com" }) }));
    expect(emailService.enviar).toHaveBeenCalledWith("pessoa@exemplo.com", expect.any(String), expect.stringContaining("/redefinir-senha?token="));
  });
});
