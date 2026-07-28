import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { GetAlertasDashboardService } from "./GetAlertasDashboardService";

const service = new GetAlertasDashboardService();

let unidadeId: number;

async function limpar() {
  await prisma.aulaAluno.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_ALERTAS_" } } } });
  await prisma.aula.deleteMany({ where: { unidade: { nome: "TESTE_ALERTAS_UNIDADE" } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_ALERTAS_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_ALERTAS_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_ALERTAS_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_ALERTAS_UNIDADE" } });
  unidadeId = unidade.id;
});
afterAll(limpar);

describe("GetAlertasDashboardService", () => {
  it("não gera nenhum alerta quando não há mensalidades vencidas nem baixa frequência", async () => {
    const alertas = await service.execute(unidadeId);
    expect(alertas).toHaveLength(0);
  });

  it("gera o alerta de mensalidades vencidas quando existem mensalidades vencidas", async () => {
    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_ALERTAS_ALUNO", dataNascimento: new Date("2015-01-01") },
    });

    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: aluno.id,
        valor: 100,
        vencimento: new Date("2020-01-01"),
        pago: false,
      },
    });

    const alertas = await service.execute(unidadeId);
    const alertaVencidas = alertas.find((a) => a.id === "mensalidades-vencidas");

    expect(alertaVencidas).toBeDefined();
    expect(alertaVencidas?.quantidade).toBe(1);
    expect(alertaVencidas?.rota).toBe("/mensalidades");
  });

  it("ordena os alertas por prioridade (CRITICA/ALTA antes de MEDIA/BAIXA)", async () => {
    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_ALERTAS_ALUNO_2", dataNascimento: new Date("2015-01-01") },
    });

    // 1 mensalidade vencida de 1 gerada -> 100% de inadimplência (CRITICA)
    await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId: aluno.id,
        valor: 100,
        vencimento: new Date("2020-01-01"),
        pago: false,
      },
    });

    const alertas = await service.execute(unidadeId);
    expect(alertas[0].prioridade).toBe("CRITICA");
  });
});
