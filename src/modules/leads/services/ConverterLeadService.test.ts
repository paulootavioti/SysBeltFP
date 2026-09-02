import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../shared/database/prisma";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";
import { AppError } from "../../../shared/errors/AppError";
import { ConverterLeadService } from "./ConverterLeadService";

const PREFIXO = "TESTE_CONVERSAO_LEAD_";
let unidadeAId: number; let unidadeBId: number; let canalAId: number; let usuarioId: number;

async function limpar() {
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.consentimento.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.graduacao.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.alunoUnidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.leadEvento.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.leadConsentimento.deleteMany({ where: { lead: { unidade: { nome: { startsWith: PREFIXO } } } } });
  await prisma.lead.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.usuarioUnidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.usuario.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.canalCaptacao.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(async () => {
  await limpar();
  const a = await criarUnidadeDeTeste(`${PREFIXO}A`); const b = await criarUnidadeDeTeste(`${PREFIXO}B`);
  unidadeAId = a.id; unidadeBId = b.id;
  canalAId = (await prisma.canalCaptacao.create({ data: { unidadeId: unidadeAId, nome: "Bot", slug: `conversao-${a.id}` } })).id;
  usuarioId = (await prisma.usuario.create({ data: { unidadeId: unidadeAId, nome: "Recepção", email: `conversao-${a.id}@teste.local`, senha: "teste", perfil: "RECEPCAO" } })).id;
});
afterAll(limpar);

describe("conversão transacional de lead", () => {
  it("cria aluno pré-preenchido e transfere a prova de consentimento", async () => {
    const lead = await prisma.lead.create({ data: {
      unidadeId: unidadeAId, canalId: canalAId, nome: "Maria Nova", telefoneE164: "5511999991111", email: "maria@teste.local",
      consentimentos: { create: { finalidade: "TRATAMENTO_DADOS", textoAceito: "Texto exato aceito", versao: "v1", ip: "203.0.113.1", userAgent: "Teste" } },
    } });
    const resultado = await new ConverterLeadService().execute(lead.id, unidadeAId, usuarioId, { dataNascimento: "2000-05-10" });
    expect(resultado).toMatchObject({ reativado: false, jaConvertido: false });
    const aluno = await prisma.aluno.findUniqueOrThrow({ where: { id: resultado.alunoId }, include: { consentimentos: true } });
    expect(aluno).toMatchObject({ nome: "Maria Nova", whatsapp: "5511999991111", email: "maria@teste.local", faixa: "Branca", grau: 0, ativo: true });
    expect(aluno.consentimentos).toEqual([expect.objectContaining({ tipo: "TRATAMENTO_DADOS", textoAceito: "Texto exato aceito", versaoPolitica: "v1", ip: "203.0.113.1" })]);
    expect(await new ConverterLeadService().execute(lead.id, unidadeAId, usuarioId, {})).toMatchObject({ alunoId: aluno.id, jaConvertido: true });
  });

  it("reativa o mesmo aluno preservando faixa, grau e graduação", async () => {
    const aluno = await prisma.aluno.create({ data: { unidadeId: unidadeAId, nome: "Ex-aluno", dataNascimento: new Date("1990-01-01"), faixa: "Roxa", grau: 3, ativo: false } });
    await prisma.graduacao.create({ data: { unidadeId: unidadeAId, alunoId: aluno.id, faixa: "Roxa", data: new Date("2024-01-01") } });
    const lead = await prisma.lead.create({ data: { unidadeId: unidadeAId, canalId: canalAId, nome: "Ex-aluno", telefoneE164: "5511999992222", situacao: "EX_ALUNO", alunoId: aluno.id } });
    const resultado = await new ConverterLeadService().execute(lead.id, unidadeAId, usuarioId, {});
    expect(resultado).toMatchObject({ alunoId: aluno.id, reativado: true });
    expect(await prisma.aluno.findUnique({ where: { id: aluno.id } })).toMatchObject({ faixa: "Roxa", grau: 3, ativo: true });
    expect(await prisma.graduacao.count({ where: { alunoId: aluno.id } })).toBe(1);
  });

  it("nega conversão solicitada por outra unidade", async () => {
    const lead = await prisma.lead.create({ data: { unidadeId: unidadeAId, canalId: canalAId, nome: "Isolado", telefoneE164: "5511999993333" } });
    await expect(new ConverterLeadService().execute(lead.id, unidadeBId, usuarioId, { dataNascimento: "2000-01-01" })).rejects.toThrow(AppError);
    expect(await prisma.aluno.count({ where: { unidadeId: unidadeAId } })).toBe(0);
  });
});
