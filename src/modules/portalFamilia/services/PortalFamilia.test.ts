import { hash } from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { LoginFamiliaService } from "./LoginFamiliaService";
import { GetResumoFamiliaService } from "./GetResumoFamiliaService";
import { ListMensagensFamiliaService } from "./ListMensagensFamiliaService";
import { EnviarMensagemFamiliaService } from "./EnviarMensagemFamiliaService";

const loginService = new LoginFamiliaService();
const resumoService = new GetResumoFamiliaService();
const listMensagensService = new ListMensagensFamiliaService();
const enviarMensagemService = new EnviarMensagemFamiliaService();

let unidadeId: number;

async function limpar() {
  await prisma.mensagemFamilia.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_VITEST_PORTAL_" } } } });
  await prisma.aulaAluno.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_VITEST_PORTAL_" } } } });
  await prisma.aula.deleteMany({ where: { turma: { nome: "TESTE_VITEST_TURMA_PORTAL" } } });
  await prisma.turma.deleteMany({ where: { nome: "TESTE_VITEST_TURMA_PORTAL" } });
  await prisma.responsavel.deleteMany({ where: { nome: { startsWith: "TESTE_VITEST_PORTAL_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_VITEST_PORTAL_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_PORTAL_FAMILIA_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_PORTAL_FAMILIA_UNIDADE" } });
  unidadeId = unidade.id;
});

afterAll(limpar);

describe("LoginFamiliaService", () => {
  it("autentica um responsável e retorna todos os filhos vinculados ao mesmo e-mail", async () => {
    const senhaHash = await hash("senha123", 8);

    const filho1 = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_VITEST_PORTAL_FILHO_1", dataNascimento: new Date("2015-01-01") },
    });
    const filho2 = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_VITEST_PORTAL_FILHO_2", dataNascimento: new Date("2017-01-01") },
    });

    await prisma.responsavel.create({
      data: {
        unidadeId,
        nome: "TESTE_VITEST_PORTAL_MAE",
        email: "mae@teste-vitest-portal.com",
        senhaPortal: senhaHash,
        alunoId: filho1.id,
      },
    });
    await prisma.responsavel.create({
      data: {
        unidadeId,
        nome: "TESTE_VITEST_PORTAL_MAE",
        email: "mae@teste-vitest-portal.com",
        alunoId: filho2.id,
      },
    });

    const sessao = await loginService.execute({ email: "mae@teste-vitest-portal.com", senha: "senha123" });

    expect(sessao.usuario.tipo).toBe("RESPONSAVEL");
    expect(sessao.alunos.map((aluno) => aluno.id).sort()).toEqual([filho1.id, filho2.id].sort());
    expect(typeof sessao.token).toBe("string");
  });

  it("rejeita senha incorreta", async () => {
    const senhaHash = await hash("senha123", 8);
    const filho = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_VITEST_PORTAL_FILHO_3", dataNascimento: new Date("2015-01-01") },
    });
    await prisma.responsavel.create({
      data: {
        unidadeId,
        nome: "TESTE_VITEST_PORTAL_PAI",
        email: "pai@teste-vitest-portal.com",
        senhaPortal: senhaHash,
        alunoId: filho.id,
      },
    });

    await expect(
      loginService.execute({ email: "pai@teste-vitest-portal.com", senha: "senha-errada" })
    ).rejects.toThrow(AppError);
  });

  it("autentica um aluno com login direto quando não há responsável correspondente", async () => {
    const senhaHash = await hash("senha456", 8);
    const aluno = await prisma.aluno.create({
      data: {
        unidadeId,
        nome: "TESTE_VITEST_PORTAL_ALUNO_DIRETO",
        dataNascimento: new Date("2000-01-01"),
        email: "aluno@teste-vitest-portal.com",
        senhaPortal: senhaHash,
      },
    });

    const sessao = await loginService.execute({ email: "aluno@teste-vitest-portal.com", senha: "senha456" });

    expect(sessao.usuario.tipo).toBe("ALUNO");
    expect(sessao.alunos).toEqual([
      expect.objectContaining({ id: aluno.id }),
    ]);
  });
});

describe("GetResumoFamiliaService", () => {
  it("calcula o progresso do ciclo de grau a partir das presenças", async () => {
    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_VITEST_PORTAL_RESUMO", dataNascimento: new Date("2015-01-01"), faixa: "Branca" },
    });

    const turma = await prisma.turma.create({
      data: { unidadeId, nome: "TESTE_VITEST_TURMA_PORTAL", faixaEtaria: "Kids", diasSemana: [1], horarioInicio: "18:00", horarioFim: "19:00" },
    });

    const aula = await prisma.aula.create({
      data: { unidadeId, data: new Date(), turmaId: turma.id },
    });

    await prisma.aulaAluno.create({
      data: { aulaId: aula.id, alunoId: aluno.id, presente: true },
    });

    const resumo = await resumoService.execute(aluno.id);

    expect(resumo.progresso.totalPresencas).toBe(1);
    expect(resumo.progresso.aulasNoCicloAtual).toBe(1);
    expect(resumo.progresso.aulasPorGrau).toBe(8);
  });
});

describe("Mensagens da família", () => {
  it("envia e lista mensagens de um aluno em ordem cronológica", async () => {
    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_VITEST_PORTAL_CHAT", dataNascimento: new Date("2015-01-01") },
    });

    await enviarMensagemService.execute({
      alunoId: aluno.id,
      remetenteTipo: "FAMILIA",
      remetenteNome: "Mãe do aluno",
      texto: "Oi, tudo bem?",
    });

    await enviarMensagemService.execute({
      alunoId: aluno.id,
      remetenteTipo: "ACADEMIA",
      remetenteNome: "Recepção",
      texto: "Tudo certo!",
    });

    const mensagens = await listMensagensService.execute(aluno.id);

    expect(mensagens).toHaveLength(2);
    expect(mensagens[0].remetenteTipo).toBe("FAMILIA");
    expect(mensagens[1].remetenteTipo).toBe("ACADEMIA");
  });

  it("rejeita mensagem vazia", async () => {
    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_VITEST_PORTAL_CHAT_VAZIO", dataNascimento: new Date("2015-01-01") },
    });

    await expect(
      enviarMensagemService.execute({
        alunoId: aluno.id,
        remetenteTipo: "FAMILIA",
        remetenteNome: "Mãe",
        texto: "   ",
      })
    ).rejects.toThrow(AppError);
  });
});
