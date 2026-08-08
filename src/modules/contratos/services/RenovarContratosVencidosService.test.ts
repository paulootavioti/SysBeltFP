import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { RenovarContratosVencidosService } from "./RenovarContratosVencidosService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const service = new RenovarContratosVencidosService();

let unidadeId: number;
let alunoId: number;
let modeloId: number;

async function limpar() {
  await prisma.contrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_RENOVAVENCIDOS_" } } } });
  await prisma.modeloContrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_RENOVAVENCIDOS_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_RENOVAVENCIDOS_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_RENOVAVENCIDOS_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await criarUnidadeDeTeste("TESTE_RENOVAVENCIDOS_UNIDADE");
  unidadeId = unidade.id;

  const aluno = await prisma.aluno.create({
    data: { unidadeId, nome: "TESTE_RENOVAVENCIDOS_ALUNO", dataNascimento: new Date("2000-01-01") },
  });
  alunoId = aluno.id;

  const modelo = await prisma.modeloContrato.create({
    data: { unidadeId, nome: "TESTE_RENOVAVENCIDOS_MODELO", conteudo: "Contrato de {{nomeAluno}}" },
  });
  modeloId = modelo.id;
});
afterAll(limpar);

const ontem = new Date();
ontem.setDate(ontem.getDate() - 1);

async function criarContratoAtivo(renovacaoAutomatica: boolean) {
  return prisma.contrato.create({
    data: {
      unidadeId,
      numero: Math.floor(Math.random() * 1_000_000),
      alunoId,
      modeloContratoId: modeloId,
      valor: 200,
      dataInicioVigencia: new Date("2025-01-01"),
      dataFimVigencia: ontem,
      conteudoGerado: "x",
      situacao: "ATIVO",
      renovacaoAutomatica,
    },
  });
}

describe("RenovarContratosVencidosService", () => {
  it("renova contratos ATIVOS vencidos com renovação automática ligada", async () => {
    const contrato = await criarContratoAtivo(true);

    const resultado = await service.execute(unidadeId);

    expect(resultado.renovados).toBe(1);

    const atualizado = await prisma.contrato.findUnique({ where: { id: contrato.id } });
    expect(atualizado?.situacao).toBe("RENOVADO");

    const novo = await prisma.contrato.findFirst({ where: { contratoAnteriorId: contrato.id } });
    expect(novo).not.toBeNull();
    expect(novo?.situacao).toBe("RASCUNHO");
  });

  it("não renova contratos sem renovação automática ligada", async () => {
    await criarContratoAtivo(false);

    const resultado = await service.execute(unidadeId);

    expect(resultado.renovados).toBe(0);
  });
});
