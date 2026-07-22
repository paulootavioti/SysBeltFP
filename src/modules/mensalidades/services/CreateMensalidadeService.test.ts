import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateMensalidadeService } from "./CreateMensalidadeService";

const service = new CreateMensalidadeService();

async function criarAluno() {
  return prisma.aluno.create({
    data: {
      nome: "TESTE_VITEST_ALUNO_MENSALIDADE",
      dataNascimento: new Date("2000-01-01"),
    },
  });
}

async function limpar() {
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: "TESTE_VITEST_ALUNO_MENSALIDADE" } } });
  await prisma.aluno.deleteMany({ where: { nome: "TESTE_VITEST_ALUNO_MENSALIDADE" } });
}

beforeEach(limpar);
afterAll(limpar);

describe("CreateMensalidadeService", () => {
  it("cria a mensalidade do mês para o aluno", async () => {
    const aluno = await criarAluno();

    const mensalidade = await service.execute({
      alunoId: aluno.id,
      valor: 150,
      vencimento: "2026-08-10",
    });

    expect(mensalidade.valor).toBe(150);
    expect(mensalidade.pago).toBe(false);
  });

  it("rejeita uma segunda mensalidade no mesmo mês para o mesmo aluno", async () => {
    const aluno = await criarAluno();

    await service.execute({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-10" });

    await expect(
      service.execute({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-25" })
    ).rejects.toThrow(AppError);
  });

  it("permite mensalidades em meses diferentes para o mesmo aluno", async () => {
    const aluno = await criarAluno();

    await service.execute({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-10" });

    const segunda = await service.execute({
      alunoId: aluno.id,
      valor: 150,
      vencimento: "2026-09-10",
    });

    expect(segunda.valor).toBe(150);
  });
});
