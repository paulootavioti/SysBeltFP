import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateMensalidadeService } from "../../mensalidades/services/CreateMensalidadeService";
import { PagarMensalidadeService } from "../../mensalidades/services/PagarMensalidadeService";
import { GetDashboardFinanceiroService } from "./GetDashboardFinanceiroService";

const createMensalidadeService = new CreateMensalidadeService();
const pagarService = new PagarMensalidadeService();
const dashboardService = new GetDashboardFinanceiroService();

let unidadeId: number;
let usuarioId: number;
let professorId: number;
let alunoId: number;

async function limpar() {
  await prisma.auditLog.deleteMany({ where: { usuario: { email: "teste.vitest.dashfin@sysbelt.local" } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_DASHFIN_" } } } });
  await prisma.turma.deleteMany({ where: { nome: { startsWith: "TESTE_DASHFIN_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_DASHFIN_" } } });
  await prisma.usuario.deleteMany({ where: { email: { contains: "teste.vitest.dashfin" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_DASHFIN_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_DASHFIN_UNIDADE" } });
  unidadeId = unidade.id;

  const admin = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_DASHFIN_ADMIN",
      email: "teste.vitest.dashfin@sysbelt.local",
      senha: "hash-fake",
      perfil: "ADMIN",
    },
  });
  usuarioId = admin.id;

  const professor = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_DASHFIN_PROFESSOR",
      email: "teste.vitest.dashfin.professor@sysbelt.local",
      senha: "hash-fake",
      perfil: "PROFESSOR",
    },
  });
  professorId = professor.id;

  const turma = await prisma.turma.create({
    data: {
      unidadeId,
      nome: "TESTE_DASHFIN_TURMA",
      faixaEtaria: "Adulto",
      diasSemana: [1, 3],
      horarioInicio: "19:00",
      horarioFim: "20:00",
      professorId,
    },
  });

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId,
      nome: "TESTE_DASHFIN_ALUNO",
      dataNascimento: new Date("2000-01-01"),
      turmaId: turma.id,
    },
  });
  alunoId = aluno.id;
});
afterAll(limpar);

describe("GetDashboardFinanceiroService", () => {
  it("calcula receita recebida, prevista, ticket médio, inadimplência e receita por professor", async () => {
    const paga = await createMensalidadeService.execute({
      alunoId,
      valor: 100,
      vencimento: "2026-08-10",
      unidadeIdUsuario: unidadeId,
      usuarioId,
    });
    await pagarService.execute(paga.id, unidadeId, usuarioId);

    await createMensalidadeService.execute({
      alunoId,
      valor: 50,
      vencimento: "2020-01-10", // vencida, propositalmente no passado
      unidadeIdUsuario: unidadeId,
      usuarioId,
    });

    const dashboard = await dashboardService.execute(unidadeId);

    expect(dashboard.receitaRecebida).toBe(100);
    expect(dashboard.receitaPrevista).toBe(150);
    expect(dashboard.mensalidadesPagas).toBe(1);
    expect(dashboard.mensalidadesVencidas).toBe(1);
    expect(dashboard.ticketMedio).toBe(100);
    expect(dashboard.taxaInadimplencia).toBe(50);
    expect(dashboard.receitaPorProfessor).toHaveLength(1);
    expect(dashboard.receitaPorProfessor[0].valor).toBe(100);
  });
});
