import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { SolicitarGraduacaoService } from "./SolicitarGraduacaoService";
import { AprovarGraduacaoService } from "./AprovarGraduacaoService";
import { RejeitarGraduacaoService } from "./RejeitarGraduacaoService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const solicitarService = new SolicitarGraduacaoService();
const aprovarService = new AprovarGraduacaoService();
const rejeitarService = new RejeitarGraduacaoService();

let unidadeId: number;
let professorId: number;
let adminId: number;

function dataHaAnosAtras(anos: number): Date {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return data;
}

async function criarAluno(opts: { idade: number; faixa: string }) {
  return prisma.aluno.create({
    data: {
      unidadeId,
      nome: "TESTE_VITEST_ALUNO_SOLICITACAO",
      dataNascimento: dataHaAnosAtras(opts.idade),
      faixa: opts.faixa,
    },
  });
}

async function limpar() {
  await prisma.graduacao.deleteMany({ where: { aluno: { nome: "TESTE_VITEST_ALUNO_SOLICITACAO" } } });
  await prisma.aluno.deleteMany({ where: { nome: "TESTE_VITEST_ALUNO_SOLICITACAO" } });
  await prisma.usuario.deleteMany({ where: { email: { in: ["professor@teste-vitest-graduacao.com", "admin@teste-vitest-graduacao.com"] } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_GRADUACAO_SOLICITACAO_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await criarUnidadeDeTeste("TESTE_GRADUACAO_SOLICITACAO_UNIDADE");
  unidadeId = unidade.id;

  const professor = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_VITEST_PROFESSOR",
      email: "professor@teste-vitest-graduacao.com",
      senha: "hash",
      perfil: "PROFESSOR",
    },
  });
  professorId = professor.id;

  const admin = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_VITEST_ADMIN",
      email: "admin@teste-vitest-graduacao.com",
      senha: "hash",
      perfil: "ADMIN",
    },
  });
  adminId = admin.id;
});

afterAll(limpar);

describe("SolicitarGraduacaoService", () => {
  it("cria uma solicitação pendente sem alterar a faixa do aluno", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    const solicitacao = await solicitarService.execute({
      alunoId: aluno.id,
      faixa: "Amarela",
      comentario: "Pronto para a próxima faixa.",
      solicitanteId: professorId,
      unidadeIdSolicitante: unidadeId,
    });

    expect(solicitacao.status).toBe("pendente");
    expect(solicitacao.solicitadoPorId).toBe(professorId);

    const alunoAtualizado = await prisma.aluno.findUniqueOrThrow({ where: { id: aluno.id } });
    expect(alunoAtualizado.faixa).toBe("Branca");
  });

  it("rejeita solicitação com faixa inválida para a trilha do aluno", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    await expect(
      solicitarService.execute({
        alunoId: aluno.id,
        faixa: "Preta",
        solicitanteId: professorId,
        unidadeIdSolicitante: unidadeId,
      })
    ).rejects.toThrow(AppError);
  });

  it("rejeita solicitação para aluno de outra unidade", async () => {
    const outraUnidade = await criarUnidadeDeTeste("TESTE_GRADUACAO_SOLICITACAO_UNIDADE_2");
    const aluno = await prisma.aluno.create({
      data: {
        unidadeId: outraUnidade.id,
        nome: "TESTE_VITEST_ALUNO_SOLICITACAO",
        dataNascimento: dataHaAnosAtras(10),
        faixa: "Branca",
      },
    });

    await expect(
      solicitarService.execute({
        alunoId: aluno.id,
        faixa: "Amarela",
        solicitanteId: professorId,
        unidadeIdSolicitante: unidadeId,
      })
    ).rejects.toThrow("Aluno não encontrado.");

    await prisma.aluno.deleteMany({ where: { unidadeId: outraUnidade.id } });
    await prisma.unidade.delete({ where: { id: outraUnidade.id } });
  });
});

describe("AprovarGraduacaoService", () => {
  it("aprova a solicitação e promove o aluno", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    const solicitacao = await solicitarService.execute({
      alunoId: aluno.id,
      faixa: "Amarela",
      solicitanteId: professorId,
      unidadeIdSolicitante: unidadeId,
    });

    const aprovada = await aprovarService.execute({
      id: solicitacao.id,
      revisorId: adminId,
      unidadeIdRevisor: unidadeId,
    });

    expect(aprovada.status).toBe("aprovada");
    expect(aprovada.revisadoPorId).toBe(adminId);

    const alunoAtualizado = await prisma.aluno.findUniqueOrThrow({ where: { id: aluno.id } });
    expect(alunoAtualizado.faixa).toBe("Amarela");
  });

  it("rejeita aprovar uma solicitação que não está pendente", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    const solicitacao = await solicitarService.execute({
      alunoId: aluno.id,
      faixa: "Amarela",
      solicitanteId: professorId,
      unidadeIdSolicitante: unidadeId,
    });

    await aprovarService.execute({ id: solicitacao.id, revisorId: adminId, unidadeIdRevisor: unidadeId });

    await expect(
      aprovarService.execute({ id: solicitacao.id, revisorId: adminId, unidadeIdRevisor: unidadeId })
    ).rejects.toThrow(/pendente/);
  });
});

describe("RejeitarGraduacaoService", () => {
  it("rejeita a solicitação e não altera a faixa do aluno", async () => {
    const aluno = await criarAluno({ idade: 10, faixa: "Branca" });

    const solicitacao = await solicitarService.execute({
      alunoId: aluno.id,
      faixa: "Amarela",
      solicitanteId: professorId,
      unidadeIdSolicitante: unidadeId,
    });

    const rejeitada = await rejeitarService.execute({
      id: solicitacao.id,
      revisorId: adminId,
      unidadeIdRevisor: unidadeId,
      motivoRejeicao: "Faltam presenças.",
    });

    expect(rejeitada.status).toBe("rejeitada");
    expect(rejeitada.motivoRejeicao).toBe("Faltam presenças.");

    const alunoAtualizado = await prisma.aluno.findUniqueOrThrow({ where: { id: aluno.id } });
    expect(alunoAtualizado.faixa).toBe("Branca");
  });
});
