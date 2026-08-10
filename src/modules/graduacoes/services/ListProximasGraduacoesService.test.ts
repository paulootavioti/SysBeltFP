import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { ListProximasGraduacoesService } from "./ListProximasGraduacoesService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new ListProximasGraduacoesService();

let unidadeId: number;

function dataHaAnosAtras(anos: number): Date {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return data;
}

async function criarAlunoComPresencas(opts: { nome: string; idade: number; faixa: string; presencas: number }) {
  const aluno = await prisma.aluno.create({
    data: {
      unidadeId,
      nome: opts.nome,
      dataNascimento: dataHaAnosAtras(opts.idade),
      faixa: opts.faixa,
    },
  });

  for (let i = 0; i < opts.presencas; i++) {
    const aula = await prisma.aula.create({ data: { unidadeId, data: new Date() } });
    await prisma.aulaAluno.create({ data: { aulaId: aula.id, alunoId: aluno.id, presente: true } });
  }

  return aluno;
}

async function limpar() {
  await prisma.aulaAluno.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_PROXGRAD_" } } } });
  await prisma.aula.deleteMany({ where: { unidade: { nome: "TESTE_PROXGRAD_UNIDADE" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_PROXGRAD_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_PROXGRAD_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await criarUnidadeDeTeste("TESTE_PROXGRAD_UNIDADE");
  unidadeId = unidade.id;
});
afterAll(limpar);

describe("ListProximasGraduacoesService", () => {
  it("calcula progresso, próxima faixa e aulas restantes pra um aluno apto (trilha Infantil)", async () => {
    await criarAlunoComPresencas({
      nome: "TESTE_PROXGRAD_ALUNO_24",
      idade: 10,
      faixa: "Branca",
      presencas: 24,
    });

    const resultado = await service.execute(unidadeId);

    expect(resultado).toHaveLength(1);
    const aluno = resultado[0];

    expect(aluno.faixa).toBe("Branca");
    expect(aluno.proximaFaixa).toBe("Cinza e Branca");
    expect(aluno.presencas).toBe(24);
    expect(aluno.aulasRealizadas).toBe(24);
    expect(aluno.percentualProgresso).toBeCloseTo(75);
    expect(aluno.aulasRestantes).toBe(8);
    expect(aluno.aptoGraduacao).toBe(true);
  });

  it("não retorna aluno cujas presenças não batem num múltiplo de 8 (não apto)", async () => {
    await criarAlunoComPresencas({
      nome: "TESTE_PROXGRAD_ALUNO_5",
      idade: 10,
      faixa: "Branca",
      presencas: 5,
    });

    const resultado = await service.execute(unidadeId);
    expect(resultado).toHaveLength(0);
  });

  it("com apenasElegiveis=false, retorna também alunos não aptos com o progresso calculado", async () => {
    await criarAlunoComPresencas({
      nome: "TESTE_PROXGRAD_ALUNO_5B",
      idade: 10,
      faixa: "Branca",
      presencas: 5,
    });

    const resultado = await service.execute(unidadeId, false);

    expect(resultado).toHaveLength(1);
    const aluno = resultado[0];
    expect(aluno.aptoGraduacao).toBe(false);
    expect(aluno.presencas).toBe(5);
    expect(aluno.grauAtual).toBe(0);
    expect(aluno.faltamParaProximoGrau).toBe(3);
  });

  it("com apenasElegiveis=false, faltamParaProximoGrau é 0 quando as presenças batem num múltiplo de 8", async () => {
    await criarAlunoComPresencas({
      nome: "TESTE_PROXGRAD_ALUNO_16",
      idade: 10,
      faixa: "Branca",
      presencas: 16,
    });

    const resultado = await service.execute(unidadeId, false);

    expect(resultado).toHaveLength(1);
    const aluno = resultado[0];
    expect(aluno.grauAtual).toBe(2);
    expect(aluno.faltamParaProximoGrau).toBe(0);
  });

  it("próximaFaixa é null quando o aluno já está na última faixa da trilha (Preta, adulto)", async () => {
    await criarAlunoComPresencas({
      nome: "TESTE_PROXGRAD_ALUNO_PRETA",
      idade: 25,
      faixa: "Preta",
      presencas: 8,
    });

    const resultado = await service.execute(unidadeId);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].proximaFaixa).toBeNull();
  });
});
