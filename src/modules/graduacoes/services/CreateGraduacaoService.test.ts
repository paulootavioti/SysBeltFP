import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateGraduacaoService } from "./CreateGraduacaoService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new CreateGraduacaoService();

let unidadeId: number;

function dataHaAnosAtras(anos: number): Date {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return data;
}

async function criarAluno(opts: { idade: number; faixa: string; faixaDesdeAnos?: number }) {
  const aluno = await prisma.aluno.create({
    data: {
      unidadeId,
      nome: "TESTE_VITEST_ALUNO",
      dataNascimento: dataHaAnosAtras(opts.idade),
      faixa: opts.faixa,
      createdAt: dataHaAnosAtras(opts.faixaDesdeAnos ?? 0),
    },
  });

  if (opts.faixaDesdeAnos) {
    await prisma.graduacao.create({
      data: {
        unidadeId,
        alunoId: aluno.id,
        faixa: opts.faixa,
        data: dataHaAnosAtras(opts.faixaDesdeAnos),
      },
    });
  }

  return aluno;
}

async function limparAlunosDeTeste() {
  await prisma.graduacao.deleteMany({ where: { aluno: { nome: "TESTE_VITEST_ALUNO" } } });
  await prisma.aluno.deleteMany({ where: { nome: "TESTE_VITEST_ALUNO" } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_GRADUACAO_UNIDADE" } });
}

beforeEach(async () => {
  await limparAlunosDeTeste();
  const unidade = await criarUnidadeDeTeste("TESTE_GRADUACAO_UNIDADE");
  unidadeId = unidade.id;
});
afterAll(limparAlunosDeTeste);

describe("CreateGraduacaoService", () => {
  it("gradua um aluno da trilha infantil para uma faixa infantil válida", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    const graduacao = await service.execute({
      alunoId: aluno.id,
      faixa: "Amarela",
      data: new Date().toISOString(),
    });

    expect(graduacao.faixa).toBe("Amarela");

    const alunoAtualizado = await prisma.aluno.findUniqueOrThrow({ where: { id: aluno.id } });
    expect(alunoAtualizado.faixa).toBe("Amarela");
  });

  it("rejeita faixa adulta para aluno da trilha infantil", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    await expect(
      service.execute({ alunoId: aluno.id, faixa: "Preta", data: new Date().toISOString() })
    ).rejects.toThrow(AppError);
  });

  it("rejeita faixa Azul para aluno adulto abaixo da idade mínima", async () => {
    const aluno = await criarAluno({ idade: 15, faixa: "Branca" });

    await expect(
      service.execute({ alunoId: aluno.id, faixa: "Azul", data: new Date().toISOString() })
    ).rejects.toThrow(/idade mínima/);
  });

  it("rejeita faixa Roxa quando o tempo mínimo na faixa Azul não foi cumprido", async () => {
    const aluno = await criarAluno({ idade: 20, faixa: "Azul", faixaDesdeAnos: 1 });

    await expect(
      service.execute({ alunoId: aluno.id, faixa: "Roxa", data: new Date().toISOString() })
    ).rejects.toThrow(/pelo menos 2 ano/);
  });

  it("aprova faixa Roxa quando idade e tempo mínimo na faixa Azul são cumpridos", async () => {
    const aluno = await criarAluno({ idade: 20, faixa: "Azul", faixaDesdeAnos: 3 });

    const graduacao = await service.execute({
      alunoId: aluno.id,
      faixa: "Roxa",
      data: new Date().toISOString(),
    });

    expect(graduacao.faixa).toBe("Roxa");
  });

  it("rejeita quando o aluno não existe", async () => {
    await expect(
      service.execute({ alunoId: -1, faixa: "Azul", data: new Date().toISOString() })
    ).rejects.toThrow("Aluno não encontrado.");
  });
});
