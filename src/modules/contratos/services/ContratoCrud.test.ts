import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateContratoService } from "./CreateContratoService";
import { UpdateContratoService } from "./UpdateContratoService";
import { GetContratoService } from "./GetContratoService";
import { AlterarSituacaoContratoService } from "./AlterarSituacaoContratoService";
import { RegistrarAssinaturaService } from "./RegistrarAssinaturaService";
import { RenovarContratoService } from "./RenovarContratoService";

const createService = new CreateContratoService();
const updateService = new UpdateContratoService();
const getService = new GetContratoService();
const situacaoService = new AlterarSituacaoContratoService();
const assinarService = new RegistrarAssinaturaService();
const renovarService = new RenovarContratoService();

let unidadeAId: number;
let unidadeBId: number;
let alunoMenorId: number;
let alunoMaiorId: number;
let alunoSemResponsavelId: number;
let responsavelId: number;
let modeloAId: number;
let usuarioId: number;

async function limpar() {
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTRATOCRUD_" } } } });
  await prisma.contrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTRATOCRUD_" } } } });
  await prisma.modeloContrato.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CONTRATOCRUD_" } } } });
  await prisma.responsavel.deleteMany({ where: { nome: { startsWith: "TESTE_CONTRATOCRUD_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_CONTRATOCRUD_" } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_contratocrud_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_CONTRATOCRUD_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_CONTRATOCRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_CONTRATOCRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const usuario = await prisma.usuario.create({
    data: {
      nome: "TESTE_CONTRATOCRUD_ADMIN",
      email: "teste_contratocrud_admin@sysbelt.com",
      senha: "x",
      perfil: "ADMIN",
      unidadeId: unidadeAId,
    },
  });
  usuarioId = usuario.id;

  const alunoMenor = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_CONTRATOCRUD_ALUNO_MENOR", dataNascimento: new Date("2015-01-01") },
  });
  alunoMenorId = alunoMenor.id;

  const responsavel = await prisma.responsavel.create({
    data: {
      unidadeId: unidadeAId,
      alunoId: alunoMenorId,
      nome: "TESTE_CONTRATOCRUD_RESPONSAVEL",
      cpf: "111.111.111-11",
      responsavelFinanceiro: true,
    },
  });
  responsavelId = responsavel.id;

  const alunoMaior = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_CONTRATOCRUD_ALUNO_MAIOR", dataNascimento: new Date("2000-01-01") },
  });
  alunoMaiorId = alunoMaior.id;

  const alunoSemResponsavel = await prisma.aluno.create({
    data: {
      unidadeId: unidadeAId,
      nome: "TESTE_CONTRATOCRUD_ALUNO_SEM_RESPONSAVEL",
      dataNascimento: new Date("2015-01-01"),
    },
  });
  alunoSemResponsavelId = alunoSemResponsavel.id;

  const modeloA = await prisma.modeloContrato.create({
    data: {
      unidadeId: unidadeAId,
      nome: "TESTE_CONTRATOCRUD_MODELO",
      conteudo: "Contrato de {{nomeAluno}}. Contratante: {{nomeContratante}}. Valor: {{valor}}.",
    },
  });
  modeloAId = modeloA.id;
});
afterAll(limpar);

function dadosBase(alunoId: number, modeloContratoId = modeloAId) {
  return {
    alunoId,
    modeloContratoId,
    valor: 300,
    dataInicioVigencia: "2026-01-01",
  };
}

describe("CreateContratoService — regra de menor de idade", () => {
  it("usa o responsável financeiro como contratante quando o aluno é menor", async () => {
    const contrato = await createService.execute({
      ...dadosBase(alunoMenorId),
      unidadeId: unidadeAId,
      usuarioId,
    });

    expect(contrato.contratanteResponsavelId).toBe(responsavelId);
    expect(contrato.conteudoGerado).toContain("TESTE_CONTRATOCRUD_RESPONSAVEL");
    expect(contrato.numero).toBe(1);
  });

  it("usa o próprio aluno como contratante quando é maior de idade", async () => {
    const contrato = await createService.execute({
      ...dadosBase(alunoMaiorId),
      unidadeId: unidadeAId,
      usuarioId,
    });

    expect(contrato.contratanteResponsavelId).toBeNull();
    expect(contrato.conteudoGerado).toContain("TESTE_CONTRATOCRUD_ALUNO_MAIOR");
  });

  it("rejeita gerar contrato pra menor sem responsável cadastrado", async () => {
    await expect(
      createService.execute({ ...dadosBase(alunoSemResponsavelId), unidadeId: unidadeAId, usuarioId })
    ).rejects.toThrow(AppError);
  });

  it("numera os contratos sequencialmente por unidade", async () => {
    await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });
    const segundo = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    expect(segundo.numero).toBe(2);
  });
});

describe("GetContratoService / UpdateContratoService — isolamento entre unidades", () => {
  it("rejeita buscar um contrato de outra unidade", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    await expect(getService.execute(contrato.id, unidadeBId)).rejects.toThrow(AppError);
  });

  it("permite editar enquanto RASCUNHO e rejeita depois de enviado pra assinatura", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    const editado = await updateService.execute(contrato.id, unidadeAId, {
      ...dadosBase(alunoMaiorId),
      valor: 500,
      usuarioId,
    });
    expect(editado.valor).toBe(500);

    await situacaoService.execute(contrato.id, unidadeAId, usuarioId, "PENDENTE_ASSINATURA");

    await expect(
      updateService.execute(contrato.id, unidadeAId, { ...dadosBase(alunoMaiorId), valor: 999, usuarioId })
    ).rejects.toThrow(AppError);
  });
});

describe("AlterarSituacaoContratoService — máquina de estados", () => {
  it("permite o caminho RASCUNHO -> PENDENTE_ASSINATURA -> (assinatura) -> ATIVO -> SUSPENSO -> ATIVO", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    const pendente = await situacaoService.execute(contrato.id, unidadeAId, usuarioId, "PENDENTE_ASSINATURA");
    expect(pendente.situacao).toBe("PENDENTE_ASSINATURA");

    const assinado = await assinarService.execute(contrato.id, unidadeAId, usuarioId, {
      tipoAssinatura: "DIGITAL",
    });
    expect(assinado.situacao).toBe("ASSINADO");
    expect(assinado.tipoAssinatura).toBe("DIGITAL");
    expect(assinado.assinadoEm).not.toBeNull();

    const ativo = await situacaoService.execute(contrato.id, unidadeAId, usuarioId, "ATIVO");
    expect(ativo.situacao).toBe("ATIVO");

    const suspenso = await situacaoService.execute(contrato.id, unidadeAId, usuarioId, "SUSPENSO");
    expect(suspenso.situacao).toBe("SUSPENSO");

    const reativado = await situacaoService.execute(contrato.id, unidadeAId, usuarioId, "ATIVO");
    expect(reativado.situacao).toBe("ATIVO");
  });

  it("rejeita uma transição inválida (RASCUNHO -> ATIVO direto)", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    await expect(situacaoService.execute(contrato.id, unidadeAId, usuarioId, "ATIVO")).rejects.toThrow(AppError);
  });

  it("exige motivo para cancelar", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    await expect(situacaoService.execute(contrato.id, unidadeAId, usuarioId, "CANCELADO")).rejects.toThrow(AppError);

    const cancelado = await situacaoService.execute(
      contrato.id,
      unidadeAId,
      usuarioId,
      "CANCELADO",
      "Aluno desistiu"
    );
    expect(cancelado.situacao).toBe("CANCELADO");
    expect(cancelado.motivoCancelamento).toBe("Aluno desistiu");
  });

  it("rejeita registrar assinatura fora de PENDENTE_ASSINATURA", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    await expect(
      assinarService.execute(contrato.id, unidadeAId, usuarioId, { tipoAssinatura: "DIGITAL" })
    ).rejects.toThrow(AppError);
  });
});

describe("RenovarContratoService", () => {
  async function ativarContrato(alunoId: number) {
    const contrato = await createService.execute({ ...dadosBase(alunoId), unidadeId: unidadeAId, usuarioId });
    await situacaoService.execute(contrato.id, unidadeAId, usuarioId, "PENDENTE_ASSINATURA");
    await assinarService.execute(contrato.id, unidadeAId, usuarioId, { tipoAssinatura: "DIGITAL" });
    return situacaoService.execute(contrato.id, unidadeAId, usuarioId, "ATIVO");
  }

  it("gera um novo contrato encadeado e marca o atual como RENOVADO", async () => {
    const contratoAtivo = await ativarContrato(alunoMaiorId);

    const renovado = await renovarService.execute(contratoAtivo.id, unidadeAId, { usuarioId });

    expect(renovado.contratoAnteriorId).toBe(contratoAtivo.id);
    expect(renovado.situacao).toBe("RASCUNHO");
    expect(renovado.numero).toBe(contratoAtivo.numero + 1);

    const original = await prisma.contrato.findUnique({ where: { id: contratoAtivo.id } });
    expect(original?.situacao).toBe("RENOVADO");
  });

  it("rejeita renovar um contrato ainda em RASCUNHO", async () => {
    const contrato = await createService.execute({ ...dadosBase(alunoMaiorId), unidadeId: unidadeAId, usuarioId });

    await expect(renovarService.execute(contrato.id, unidadeAId, { usuarioId })).rejects.toThrow(AppError);
  });
});
