import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { ListAlunosService } from "./ListAlunosService";
import { GetAlunoCompletoService } from "./GetAlunoCompletoService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

let unidadeId: number;
let alunoId: number;

async function limpar() {
  // criar aluno agora gera consentimento e auditoria — ambos
  // apontam pra unidade e precisam sair antes dela.
  await prisma.consentimento.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_REDACAO_" } } } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_REDACAO_" } } } });
  await prisma.responsavel.deleteMany({ where: { nome: { startsWith: "TESTE_REDACAO_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_REDACAO_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_REDACAO_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await criarUnidadeDeTeste("TESTE_REDACAO_UNIDADE");
  unidadeId = unidade.id;

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId,
      nome: "TESTE_REDACAO_ALUNO",
      apelido: "TESTE_REDACAO_APELIDO",
      dataNascimento: new Date("2010-05-20"),
      cpf: "111.111.111-11",
      telefone: "61999999999",
      logradouro: "Rua Teste",
      restricoesMedicas: "Nenhuma",
      unidadesPermitidas: { create: { unidadeId } },
    },
  });
  alunoId = aluno.id;

  await prisma.responsavel.create({
    data: {
      unidadeId,
      alunoId,
      nome: "TESTE_REDACAO_RESPONSAVEL",
      parentesco: "Mãe",
      telefone: "61988888888",
      responsavelFinanceiro: true,
    },
  });
});
afterAll(limpar);

describe("Redação de campos do Aluno para PROFESSOR", () => {
  it("ListAlunosService: PROFESSOR não recebe CPF, telefone, endereço nem dados de saúde", async () => {
    const [registro] = await new ListAlunosService().execute(unidadeId, "PROFESSOR");
    const aluno = registro as unknown as {
      nome: string;
      apelido: string | null;
      responsaveis: { id: number; nome: string }[];
    };

    expect(aluno.nome).toBe("TESTE_REDACAO_ALUNO");
    expect(aluno.apelido).toBe("TESTE_REDACAO_APELIDO");
    expect(aluno.responsaveis?.[0]?.nome).toBe("TESTE_REDACAO_RESPONSAVEL");

    expect(aluno).not.toHaveProperty("cpf");
    expect(aluno).not.toHaveProperty("telefone");
    expect(aluno).not.toHaveProperty("logradouro");
    expect(aluno).not.toHaveProperty("restricoesMedicas");
    expect((aluno.responsaveis?.[0] as Record<string, unknown>)).not.toHaveProperty("telefone");
  });

  it("ListAlunosService: ADMIN continua recebendo o cadastro completo", async () => {
    const [aluno] = await new ListAlunosService().execute(unidadeId, "ADMIN");

    expect((aluno as Record<string, unknown>).cpf).toBe("111.111.111-11");
  });

  it("GetAlunoCompletoService: PROFESSOR não recebe CPF, telefone, endereço, saúde nem mensalidades", async () => {
    const aluno = await new GetAlunoCompletoService().execute(alunoId, unidadeId, "PROFESSOR");

    expect(aluno.nome).toBe("TESTE_REDACAO_ALUNO");
    expect(aluno.responsaveis?.[0]?.nome).toBe("TESTE_REDACAO_RESPONSAVEL");
    expect(aluno.presencas).toEqual([]);
    expect(aluno.graduacoes).toEqual([]);

    expect(aluno).not.toHaveProperty("cpf");
    expect(aluno).not.toHaveProperty("telefone");
    expect(aluno).not.toHaveProperty("logradouro");
    expect(aluno).not.toHaveProperty("restricoesMedicas");
    expect(aluno).not.toHaveProperty("mensalidades");
    expect(aluno).not.toHaveProperty("comportamentos");
  });

  it("GetAlunoCompletoService: ADMIN continua recebendo o prontuário completo", async () => {
    const aluno = await new GetAlunoCompletoService().execute(alunoId, unidadeId, "ADMIN");

    expect((aluno as Record<string, unknown>).cpf).toBe("111.111.111-11");
    expect(aluno).toHaveProperty("mensalidades");
  });
});
