import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../database/prisma";
import { comContextoRequisicao } from "../context/contextoRequisicao";
import { ListTurmasService } from "../../modules/turmas/services/ListTurmasService";
import { ListAlunosService } from "../../modules/alunos/services/ListAlunosService";
import { montarWhereMensalidade } from "../../modules/financeiro/utils/filtros";

// Um banco de tenant pode conter mais de um assinante. Quem não tem unidade
// ativa — o DONO, RN-164 — alcança as filiais da PRÓPRIA academia; até aqui
// "sem unidade ativa" virava consulta sem filtro, e a consulta sem filtro
// devolve o assinante vizinho junto.
//
// Estes testes exercitam os services de verdade, e não só o helper: é a
// junção dos dois (escopo + query) que vaza ou não vaza.

const PREFIXO = "TESTE_ENTRECONTAS_";

async function limpar() {
  await prisma.alunoUnidade.deleteMany({
    where: { aluno: { nome: { startsWith: PREFIXO } } },
  });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function academia(nome: string) {
  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}${nome}` } });
  const unidade = await prisma.unidade.create({
    data: { contaId: conta.id, nome: `${PREFIXO}${nome} Matriz` },
  });

  await prisma.turma.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}${nome} Turma`,
      faixaEtaria: "ADULTO",
      diasSemana: [1],
      horarioInicio: "19:00",
      horarioFim: "20:00",
    },
  });

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}${nome} Aluno`,
      dataNascimento: new Date("2010-01-01"),
    },
  });

  await prisma.alunoUnidade.create({ data: { alunoId: aluno.id, unidadeId: unidade.id } });

  return { unidade };
}

async function duasAcademias() {
  const alfa = await academia("Alfa");
  const beta = await academia("Beta");

  return { alfa, beta };
}

/** O DONO da Alfa: sem unidade ativa, alcançando só as unidades da Alfa. */
const comoDonoDaAlfa = <T>(unidadeAlfa: number, acao: () => Promise<T>) =>
  comContextoRequisicao({ usuarioId: 1, unidadesDoUsuario: [unidadeAlfa] }, acao);

describe("fronteira entre assinantes no mesmo banco", () => {
  it("DONO não enxerga as turmas do outro assinante", async () => {
    const { alfa } = await duasAcademias();

    const nomes = await comoDonoDaAlfa(alfa.unidade.id, async () =>
      (await new ListTurmasService().execute(null)).map((t) => t.nome)
    );

    expect(nomes).toContain(`${PREFIXO}Alfa Turma`);
    expect(nomes).not.toContain(`${PREFIXO}Beta Turma`);
  });

  // Aluno escapa pela junção AlunoUnidade, não pela coluna unidadeId — o
  // escopo tem que atravessar a junção junto.
  it("DONO não enxerga os alunos do outro assinante", async () => {
    const { alfa } = await duasAcademias();

    const nomes = await comoDonoDaAlfa(alfa.unidade.id, async () =>
      (await new ListAlunosService().execute(null)).map((a) => a.nome)
    );

    expect(nomes).toContain(`${PREFIXO}Alfa Aluno`);
    expect(nomes).not.toContain(`${PREFIXO}Beta Aluno`);
  });

  // O filtro de unidade do financeiro vinha da querystring e sobrescrevia o
  // escopo: bastava passar o id da unidade do vizinho.
  it("filtro de unidade não leva o financeiro para fora da conta", async () => {
    const { alfa, beta } = await duasAcademias();

    const where = await comoDonoDaAlfa(alfa.unidade.id, async () =>
      montarWhereMensalidade(null, { unidadeId: beta.unidade.id })
    );

    expect(where.unidadeId).toEqual({ in: [alfa.unidade.id] });
  });

  it("mas o filtro continua funcionando dentro da conta", async () => {
    const { alfa } = await duasAcademias();

    const where = await comoDonoDaAlfa(alfa.unidade.id, async () =>
      montarWhereMensalidade(null, { unidadeId: alfa.unidade.id })
    );

    expect(where.unidadeId).toBe(alfa.unidade.id);
  });
});
