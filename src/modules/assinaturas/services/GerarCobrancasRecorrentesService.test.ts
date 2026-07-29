import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateAssinaturaService } from "./CreateAssinaturaService";
import { GerarCobrancasRecorrentesService } from "./GerarCobrancasRecorrentesService";

const createService = new CreateAssinaturaService();
const gerarService = new GerarCobrancasRecorrentesService();

let unidadeAId: number;
let unidadeBId: number;
let alunoAId: number;
let alunoBId: number;

const hoje = new Date();
const seiseMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1).toISOString();
const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15).toISOString();

async function limpar() {
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_GERARCOBRANCA_" } } } });
  await prisma.assinatura.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_GERARCOBRANCA_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_GERARCOBRANCA_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_GERARCOBRANCA_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_GERARCOBRANCA_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_GERARCOBRANCA_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const alunoA = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_GERARCOBRANCA_ALUNO_A", dataNascimento: new Date("2000-01-01") },
  });
  alunoAId = alunoA.id;

  const alunoB = await prisma.aluno.create({
    data: { unidadeId: unidadeBId, nome: "TESTE_GERARCOBRANCA_ALUNO_B", dataNascimento: new Date("2000-01-01") },
  });
  alunoBId = alunoB.id;
});
afterAll(limpar);

describe("GerarCobrancasRecorrentesService", () => {
  it("gera a mensalidade do mês pra uma assinatura ativa", async () => {
    const assinatura = await createService.execute({
      unidadeId: unidadeAId,
      alunoId: alunoAId,
      valor: 150,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: true,
      desconto: 10,
      multa: 5,
    });

    const resultado = await gerarService.execute(unidadeAId);

    expect(resultado.geradas).toBe(1);
    expect(resultado.ignoradasPorDuplicidade).toBe(0);

    const mensalidade = await prisma.mensalidade.findFirst({ where: { assinaturaId: assinatura.id } });
    expect(mensalidade).not.toBeNull();
    expect(mensalidade?.valorFinal).toBe(145);

    const assinaturaAtualizada = await prisma.assinatura.findUnique({ where: { id: assinatura.id } });
    expect(assinaturaAtualizada?.parcelasGeradas).toBe(1);
  });

  it("é idempotente: rodar duas vezes no mesmo mês não duplica", async () => {
    await createService.execute({
      unidadeId: unidadeAId,
      alunoId: alunoAId,
      valor: 150,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: true,
    });

    await gerarService.execute(unidadeAId);
    const segundaRodada = await gerarService.execute(unidadeAId);

    expect(segundaRodada.geradas).toBe(0);
    expect(segundaRodada.ignoradasPorDuplicidade).toBe(1);

    const mensalidades = await prisma.mensalidade.findMany({ where: { alunoId: alunoAId } });
    expect(mensalidades).toHaveLength(1);
  });

  it("conclui a assinatura ao atingir o número de parcelas configurado", async () => {
    const assinatura = await createService.execute({
      unidadeId: unidadeAId,
      alunoId: alunoAId,
      valor: 150,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: false,
      numeroParcelas: 1,
    });

    const resultado = await gerarService.execute(unidadeAId);

    expect(resultado.geradas).toBe(1);
    expect(resultado.concluidas).toBe(1);

    const assinaturaAtualizada = await prisma.assinatura.findUnique({ where: { id: assinatura.id } });
    expect(assinaturaAtualizada?.status).toBe("CONCLUIDA");
  });

  it("conclui, sem gerar, uma assinatura cuja data de término já passou", async () => {
    const assinatura = await createService.execute({
      unidadeId: unidadeAId,
      alunoId: alunoAId,
      valor: 150,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      dataFim: umMesAtras,
      indeterminado: true,
    });

    const resultado = await gerarService.execute(unidadeAId);

    expect(resultado.geradas).toBe(0);
    expect(resultado.concluidas).toBe(1);

    const assinaturaAtualizada = await prisma.assinatura.findUnique({ where: { id: assinatura.id } });
    expect(assinaturaAtualizada?.status).toBe("CONCLUIDA");

    const mensalidades = await prisma.mensalidade.findMany({ where: { assinaturaId: assinatura.id } });
    expect(mensalidades).toHaveLength(0);
  });

  it("respeita o isolamento por unidade ao gerar cobranças", async () => {
    await createService.execute({
      unidadeId: unidadeAId,
      alunoId: alunoAId,
      valor: 150,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: true,
    });
    await createService.execute({
      unidadeId: unidadeBId,
      alunoId: alunoBId,
      valor: 200,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: true,
    });

    const resultado = await gerarService.execute(unidadeAId);
    expect(resultado.geradas).toBe(1);

    const mensalidadesB = await prisma.mensalidade.findMany({ where: { alunoId: alunoBId } });
    expect(mensalidadesB).toHaveLength(0);
  });

  it("com unidadeId nulo (disparo global/cron), gera pra todas as unidades", async () => {
    await createService.execute({
      unidadeId: unidadeAId,
      alunoId: alunoAId,
      valor: 150,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: true,
    });
    await createService.execute({
      unidadeId: unidadeBId,
      alunoId: alunoBId,
      valor: 200,
      diaVencimento: 10,
      dataInicio: seiseMesesAtras,
      indeterminado: true,
    });

    const resultado = await gerarService.execute(null);
    expect(resultado.geradas).toBe(2);
  });
});
