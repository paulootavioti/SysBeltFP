import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../shared/database/prisma";
import { criarUnidadeDeTeste, criarUnidadeSemRecursos } from "../../../shared/testing/criarUnidadeDeTeste";
import { comContextoRequisicao } from "../../../shared/context/contextoRequisicao";
import { CriarLeadPublicoV2Service } from "./CriarLeadPublicoV2Service";
import { GetCaptacaoPublicaService } from "./GetCaptacaoPublicaService";
import { TEXTO_CONSENTIMENTO_DADOS, VERSAO_CONSENTIMENTO_LEAD } from "../consentimentos";

const PREFIXO = "TESTE_CAPTACAO_";
let unidadeId: number;
let contaId: number;
let modalidadeId: number;
let slug: string;

async function limpar() {
  await prisma.leadConsentimento.deleteMany({ where: { lead: { unidade: { nome: { startsWith: PREFIXO } } } } });
  await prisma.leadEvento.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.lead.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.canalCaptacao.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.alunoUnidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.modalidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await criarUnidadeDeTeste(`${PREFIXO}PRINCIPAL`);
  unidadeId = unidade.id;
  contaId = unidade.contaId;
  slug = `instagram-${unidadeId}`;
  modalidadeId = (await prisma.modalidade.create({ data: { unidadeId, nome: "Jiu-Jitsu", ativo: true } })).id;
  await prisma.canalCaptacao.create({ data: { unidadeId, nome: "Instagram", slug } });
});
afterAll(limpar);

function entrada(telefone = "(11) 99999-0001") {
  return {
    nome: "Maria Silva", telefone, email: "maria@example.com", tipoContato: "PRATICANTE" as const,
    situacao: "NUNCA_TREINOU" as const, modalidadeInteresseId: modalidadeId,
    turnoPreferido: ["NOITE"], consentimentoDados: true as const,
    consentimentoComunicacoes: true,
  };
}

describe("captação pública por canal", () => {
  it("expõe somente academia, unidade, modalidades ativas e textos de consentimento", async () => {
    const pagina = await new GetCaptacaoPublicaService().execute(slug);
    expect(pagina.unidade).toBe(`${PREFIXO}PRINCIPAL`);
    expect(pagina.modalidades).toEqual([expect.objectContaining({ id: modalidadeId, nome: "Jiu-Jitsu" })]);
    expect(pagina.consentimentos).toMatchObject({ versao: VERSAO_CONSENTIMENTO_LEAD, tratamentoDados: TEXTO_CONSENTIMENTO_DADOS });
    expect(pagina).not.toHaveProperty("unidadeId");
  });

  it("normaliza o telefone, cria timeline e grava o consentimento exato com contexto", async () => {
    await comContextoRequisicao({ ip: "203.0.113.10", dispositivo: "Teste/1.0" }, () =>
      new CriarLeadPublicoV2Service().execute(slug, entrada()),
    );
    const lead = await prisma.lead.findFirstOrThrow({ where: { unidadeId }, include: { eventos: true, consentimentos: true } });
    expect(lead.telefoneE164).toBe("5511999990001");
    expect(lead.proximaAcaoEm!.getTime() - lead.criadoEm.getTime()).toBeGreaterThanOrEqual(899_000);
    expect(lead.eventos).toHaveLength(1);
    expect(lead.consentimentos).toEqual(expect.arrayContaining([
      expect.objectContaining({ finalidade: "TRATAMENTO_DADOS", textoAceito: TEXTO_CONSENTIMENTO_DADOS, versao: VERSAO_CONSENTIMENTO_LEAD, ip: "203.0.113.10", userAgent: "Teste/1.0" }),
    ]));
  });

  it("não duplica o telefone em outra filial da mesma academia", async () => {
    const filial = await prisma.unidade.create({ data: { contaId, nome: `${PREFIXO}FILIAL` } });
    const canalFilial = await prisma.canalCaptacao.create({ data: { unidadeId: filial.id, nome: "Indicação", slug: `indicacao-${filial.id}` } });
    await prisma.lead.create({ data: { unidadeId: filial.id, canalId: canalFilial.id, nome: "Existente", telefoneE164: "5511999990001" } });

    await new CriarLeadPublicoV2Service().execute(slug, entrada());
    expect(await prisma.lead.count({ where: { unidade: { contaId }, telefoneE164: "5511999990001" } })).toBe(1);
  });

  it("mantém um único lead quando duas submissões chegam juntas", async () => {
    await Promise.all([
      new CriarLeadPublicoV2Service().execute(slug, entrada()),
      new CriarLeadPublicoV2Service().execute(slug, entrada()),
    ]);
    expect(await prisma.lead.count({ where: { unidadeId, telefoneE164: "5511999990001" } })).toBe(1);
  });

  it("não deixa o mesmo telefone de outra academia bloquear a captação", async () => {
    const outra = await criarUnidadeSemRecursos(`${PREFIXO}OUTRA_CONTA`);
    const canalOutra = await prisma.canalCaptacao.create({ data: { unidadeId: outra.id, nome: "Outro", slug: `outro-${outra.id}` } });
    await prisma.lead.create({ data: { unidadeId: outra.id, canalId: canalOutra.id, nome: "Outra academia", telefoneE164: "5511999990001" } });

    await new CriarLeadPublicoV2Service().execute(slug, entrada());
    expect(await prisma.lead.count({ where: { telefoneE164: "5511999990001" } })).toBe(2);
  });

  it("identifica aluno inativo como ex-aluno sem criar novo aluno", async () => {
    const aluno = await prisma.aluno.create({ data: { unidadeId, nome: "Maria antiga", dataNascimento: new Date("2000-01-01"), whatsapp: "11999990001", ativo: false } });
    await new CriarLeadPublicoV2Service().execute(slug, entrada());
    const lead = await prisma.lead.findFirstOrThrow({ where: { unidadeId, telefoneE164: "5511999990001" } });
    expect(lead).toMatchObject({ situacao: "EX_ALUNO", alunoId: aluno.id });
    expect(await prisma.aluno.count({ where: { unidadeId } })).toBe(1);
  });
});
