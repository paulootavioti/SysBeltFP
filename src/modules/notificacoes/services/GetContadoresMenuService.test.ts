import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { GetContadoresMenuService } from "./GetContadoresMenuService";

const service = new GetContadoresMenuService();

let unidadeAId: number;
let unidadeBId: number;
let alunoAId: number;

async function limpar() {
  await prisma.contrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.modeloContrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.aulaAluno.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.aula.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_CONTADORESMENU_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_CONTADORESMENU_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_CONTADORESMENU_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const alunoA = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_CONTADORESMENU_ALUNO_A", dataNascimento: new Date("2000-01-01") },
  });
  alunoAId = alunoA.id;
});
afterAll(limpar);

describe("GetContadoresMenuService", () => {
  it("conta mensalidades vencidas só da própria unidade", async () => {
    await prisma.mensalidade.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        valor: 100,
        vencimento: new Date("2020-01-01"),
        pago: false,
      },
    });
    await prisma.mensalidade.create({
      data: {
        unidadeId: unidadeAId,
        alunoId: alunoAId,
        valor: 100,
        vencimento: new Date("2999-01-01"),
        pago: false,
      },
    });

    const contadoresA = await service.execute(unidadeAId);
    const contadoresB = await service.execute(unidadeBId);

    expect(contadoresA.mensalidadesVencidas).toBe(1);
    expect(contadoresB.mensalidadesVencidas).toBe(0);
  });

  it("conta contratos pendentes de assinatura só da própria unidade", async () => {
    const modelo = await prisma.modeloContrato.create({
      data: { unidadeId: unidadeAId, nome: "TESTE_CONTADORESMENU_MODELO", conteudo: "x" },
    });

    await prisma.contrato.create({
      data: {
        unidadeId: unidadeAId,
        numero: 1,
        alunoId: alunoAId,
        modeloContratoId: modelo.id,
        valor: 100,
        dataInicioVigencia: new Date(),
        conteudoGerado: "x",
        situacao: "PENDENTE_ASSINATURA",
      },
    });
    await prisma.contrato.create({
      data: {
        unidadeId: unidadeAId,
        numero: 2,
        alunoId: alunoAId,
        modeloContratoId: modelo.id,
        valor: 100,
        dataInicioVigencia: new Date(),
        conteudoGerado: "x",
        situacao: "RASCUNHO",
      },
    });

    const contadoresA = await service.execute(unidadeAId);
    const contadoresB = await service.execute(unidadeBId);

    expect(contadoresA.contratosAguardandoAssinatura).toBe(1);
    expect(contadoresB.contratosAguardandoAssinatura).toBe(0);
  });

  it("conta graduações pendentes usando a mesma regra de Próximas Promoções", async () => {
    for (let i = 0; i < 8; i++) {
      const aula = await prisma.aula.create({ data: { unidadeId: unidadeAId, data: new Date() } });
      await prisma.aulaAluno.create({ data: { aulaId: aula.id, alunoId: alunoAId, presente: true } });
    }

    const contadoresA = await service.execute(unidadeAId);
    expect(contadoresA.graduacoesPendentes).toBe(1);
  });
});
