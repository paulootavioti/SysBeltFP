import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateMensalidadeService } from "./CreateMensalidadeService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new CreateMensalidadeService();

let unidadeId: number;
let usuarioId: number;

function dadosBase(extra: { alunoId: number; valor: number; vencimento: string }) {
  return { ...extra, unidadeIdUsuario: unidadeId, usuarioId };
}

async function criarAluno() {
  return prisma.aluno.create({
    data: {
      unidadeId,
      nome: "TESTE_VITEST_ALUNO_MENSALIDADE",
      dataNascimento: new Date("2000-01-01"),
    },
  });
}

async function limpar() {
  await prisma.auditLog.deleteMany({ where: { usuario: { email: "teste.vitest.mensalidade@sysbelt.local" } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: "TESTE_VITEST_ALUNO_MENSALIDADE" } } });
  await prisma.aluno.deleteMany({ where: { nome: "TESTE_VITEST_ALUNO_MENSALIDADE" } });
  await prisma.usuario.deleteMany({ where: { email: "teste.vitest.mensalidade@sysbelt.local" } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_MENSALIDADE_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await criarUnidadeDeTeste("TESTE_MENSALIDADE_UNIDADE");
  unidadeId = unidade.id;

  const usuario = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_VITEST_ADMIN_MENSALIDADE",
      email: "teste.vitest.mensalidade@sysbelt.local",
      senha: "hash-fake",
      perfil: "ADMIN",
    },
  });
  usuarioId = usuario.id;
});
afterAll(limpar);

describe("CreateMensalidadeService", () => {
  it("cria a mensalidade do mês para o aluno", async () => {
    const aluno = await criarAluno();

    const mensalidade = await service.execute(
      dadosBase({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-10" })
    );

    expect(mensalidade.valor).toBe(150);
    expect(mensalidade.pago).toBe(false);
    expect(mensalidade.valorFinal).toBe(150);
  });

  it("rejeita uma segunda mensalidade no mesmo mês para o mesmo aluno", async () => {
    const aluno = await criarAluno();

    await service.execute(dadosBase({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-10" }));

    await expect(
      service.execute(dadosBase({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-25" }))
    ).rejects.toThrow(AppError);
  });

  it("permite mensalidades em meses diferentes para o mesmo aluno", async () => {
    const aluno = await criarAluno();

    await service.execute(dadosBase({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-10" }));

    const segunda = await service.execute(
      dadosBase({ alunoId: aluno.id, valor: 150, vencimento: "2026-09-10" })
    );

    expect(segunda.valor).toBe(150);
  });

  it("calcula o valorFinal com desconto, acréscimo, multa e juros", async () => {
    const aluno = await criarAluno();

    const mensalidade = await service.execute({
      ...dadosBase({ alunoId: aluno.id, valor: 200, vencimento: "2026-08-10" }),
      desconto: 20,
      acrescimo: 5,
      multa: 10,
      juros: 5,
    });

    // 200 - 20 + 5 + 10 + 5 = 200
    expect(mensalidade.valorFinal).toBe(200);
  });

  it("grava um AuditLog de criação", async () => {
    const aluno = await criarAluno();

    const mensalidade = await service.execute(
      dadosBase({ alunoId: aluno.id, valor: 150, vencimento: "2026-08-10" })
    );

    const auditoria = await prisma.auditLog.findFirst({
      where: { entidade: "Mensalidade", entidadeId: mensalidade.id },
    });

    expect(auditoria).not.toBeNull();
    expect(auditoria?.operacao).toBe("CRIACAO");
    expect(auditoria?.usuarioId).toBe(usuarioId);
  });
});
