import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateAssinaturaService } from "./CreateAssinaturaService";
import { UpdateAssinaturaService } from "./UpdateAssinaturaService";
import { AlterarStatusAssinaturaService } from "./AlterarStatusAssinaturaService";
import { ListAssinaturasService } from "./ListAssinaturasService";

const createService = new CreateAssinaturaService();
const updateService = new UpdateAssinaturaService();
const statusService = new AlterarStatusAssinaturaService();
const listService = new ListAssinaturasService();

let unidadeAId: number;
let unidadeBId: number;
let alunoAId: number;
let alunoBId: number;

async function limpar() {
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_ASSINATURACRUD_" } } } });
  await prisma.assinatura.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_ASSINATURACRUD_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_ASSINATURACRUD_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_ASSINATURACRUD_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_ASSINATURACRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_ASSINATURACRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const alunoA = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_ASSINATURACRUD_ALUNO_A", dataNascimento: new Date("2000-01-01") },
  });
  alunoAId = alunoA.id;

  const alunoB = await prisma.aluno.create({
    data: { unidadeId: unidadeBId, nome: "TESTE_ASSINATURACRUD_ALUNO_B", dataNascimento: new Date("2000-01-01") },
  });
  alunoBId = alunoB.id;
});
afterAll(limpar);

function dadosBase(alunoId: number) {
  return {
    alunoId,
    valor: 150,
    diaVencimento: 10,
    dataInicio: "2026-01-01",
    indeterminado: true,
  };
}

describe("CreateAssinaturaService", () => {
  it("cria a assinatura vinculada à unidade do aluno", async () => {
    const assinatura = await createService.execute({ ...dadosBase(alunoAId), unidadeId: unidadeAId });

    expect(assinatura.unidadeId).toBe(unidadeAId);
    expect(assinatura.status).toBe("ATIVA");
    expect(assinatura.parcelasGeradas).toBe(0);
  });

  it("rejeita criar assinatura pra aluno de outra unidade", async () => {
    await expect(createService.execute({ ...dadosBase(alunoBId), unidadeId: unidadeAId })).rejects.toThrow(AppError);
  });
});

describe("ListAssinaturasService — isolamento entre unidades", () => {
  it("só lista as assinaturas da própria unidade", async () => {
    await createService.execute({ ...dadosBase(alunoAId), unidadeId: unidadeAId });
    await createService.execute({ ...dadosBase(alunoBId), unidadeId: unidadeBId });

    const listaA = await listService.execute(unidadeAId);

    expect(listaA).toHaveLength(1);
    expect(listaA[0].alunoId).toBe(alunoAId);
  });
});

describe("UpdateAssinaturaService / AlterarStatusAssinaturaService — isolamento", () => {
  it("rejeita atualizar uma assinatura de outra unidade", async () => {
    const assinatura = await createService.execute({ ...dadosBase(alunoAId), unidadeId: unidadeAId });

    await expect(
      updateService.execute(assinatura.id, { ...dadosBase(alunoAId), valor: 200 }, unidadeBId)
    ).rejects.toThrow(AppError);
  });

  it("permite pausar e reativar dentro da mesma unidade", async () => {
    const assinatura = await createService.execute({ ...dadosBase(alunoAId), unidadeId: unidadeAId });

    const pausada = await statusService.execute(assinatura.id, unidadeAId, "PAUSADA");
    expect(pausada.status).toBe("PAUSADA");

    const reativada = await statusService.execute(assinatura.id, unidadeAId, "ATIVA");
    expect(reativada.status).toBe("ATIVA");
  });

  it("rejeita reativar uma assinatura já concluída", async () => {
    const assinatura = await createService.execute({ ...dadosBase(alunoAId), unidadeId: unidadeAId });
    await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "CONCLUIDA" } });

    await expect(statusService.execute(assinatura.id, unidadeAId, "ATIVA")).rejects.toThrow(AppError);
  });
});
