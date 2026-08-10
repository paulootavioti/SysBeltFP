import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";
import { inicioDoDiaUTC, somarDiasUTC } from "../../../shared/utils/dataCalendario";
import { RegistrarConsentimentoService } from "../../consentimentos/services/RegistrarConsentimentoService";
import { AvisarAcessoService } from "./AvisarAcessoService";
import { LembreteAulaService } from "./LembreteAulaService";
import { ReguaCobrancaService } from "./ReguaCobrancaService";
import { destinatarioDoAluno } from "../utils/destinatario";

const PREFIXO = "TESTE_GATILHO_";

const regua = new ReguaCobrancaService();
const lembrete = new LembreteAulaService();
const avisarAcesso = new AvisarAcessoService();
const registrarConsentimento = new RegistrarConsentimentoService();

async function limpar() {
  const daUnidade = { unidade: { nome: { startsWith: PREFIXO } } };

  await prisma.mensagemWhatsapp.deleteMany({ where: daUnidade });
  await prisma.eventoAcesso.deleteMany({ where: daUnidade });
  await prisma.aulaProgramada.deleteMany({ where: daUnidade });
  await prisma.mensalidade.deleteMany({ where: daUnidade });
  await prisma.auditLog.deleteMany({ where: daUnidade });
  await prisma.consentimento.deleteMany({ where: daUnidade });
  await prisma.responsavel.deleteMany({ where: daUnidade });
  await prisma.aluno.deleteMany({ where: daUnidade });
  await prisma.turma.deleteMany({ where: daUnidade });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_gatilho_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function cenario(opcoes: { comResponsavel?: boolean; comConsentimento?: boolean } = {}) {
  const { comResponsavel = true, comConsentimento = true } = opcoes;

  const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE`);

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidade.id,
      nome: "Joana Silva",
      dataNascimento: new Date("2015-04-10"),
      telefone: comResponsavel ? null : "(41) 98888-1111",
    },
  });

  if (comResponsavel) {
    await prisma.responsavel.create({
      data: {
        unidadeId: unidade.id,
        alunoId: aluno.id,
        nome: "Marcos Silva",
        whatsapp: "(41) 99999-2222",
      },
    });
  }

  const usuario = await prisma.usuario.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}Recep`,
      email: "teste_gatilho_recep@x.com",
      senha: "x",
      perfil: "RECEPCAO",
    },
  });

  if (comConsentimento) {
    await registrarConsentimento.execute(
      { alunoId: aluno.id, tipo: "COMUNICACOES", concedido: true },
      unidade.id,
      usuario.id
    );
  }

  return { unidade, aluno, usuario };
}

async function mensagensDe(unidadeId: number) {
  return prisma.mensagemWhatsapp.findMany({ where: { unidadeId }, orderBy: { id: "asc" } });
}

describe("quem recebe o aviso", () => {
  it("é o responsável, e não a criança", async () => {
    const { aluno } = await cenario();

    const destinatario = await destinatarioDoAluno(aluno.id);

    expect(destinatario?.nome).toBe("Marcos Silva");
    expect(destinatario?.telefone).toBe("(41) 99999-2222");
  });

  it("cai no próprio aluno quando não há responsável (aluno adulto)", async () => {
    const { aluno } = await cenario({ comResponsavel: false });

    const destinatario = await destinatarioDoAluno(aluno.id);

    expect(destinatario?.telefone).toBe("(41) 98888-1111");
    expect(destinatario?.responsavelId).toBeNull();
  });

  it("sem telefone nenhum, não inventa destinatário", async () => {
    const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE`);
    const semTelefone = await prisma.aluno.create({
      data: {
        unidadeId: unidade.id,
        nome: "Sem Telefone",
        dataNascimento: new Date("2014-01-01"),
      },
    });

    expect(await destinatarioDoAluno(semTelefone.id)).toBeNull();
  });
});

describe("régua de cobrança", () => {
  const HOJE = new Date("2026-09-10T12:00:00Z");

  async function mensalidade(unidadeId: number, alunoId: number, vencimento: Date, status = "ABERTA") {
    return prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId,
        valor: 180,
        valorOriginal: 180,
        valorFinal: 180,
        vencimento,
        status: status as "ABERTA",
      },
    });
  }

  it("avisa quem vence em 3 dias", async () => {
    const { unidade, aluno } = await cenario();
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(HOJE), 3));

    const resultado = await regua.execute(HOJE, unidade.id);

    expect(resultado.enviadas).toBe(1);

    const [mensagem] = await mensagensDe(unidade.id);
    expect(mensagem.template).toBe("mensalidade_vencendo");
    // fala com o responsável pelo primeiro nome, e cita a criança.
    expect(mensagem.parametros).toEqual(["Marcos", "Joana", "13/09/2026", "180,00"]);
  });

  it("não avisa quem vence em outro dia", async () => {
    const { unidade, aluno } = await cenario();
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(HOJE), 7));

    expect((await regua.execute(HOJE, unidade.id)).enviadas).toBe(0);
  });

  it("avisa quem já venceu, com o texto de vencida", async () => {
    const { unidade, aluno } = await cenario();
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(HOJE), -5));

    await regua.execute(HOJE, unidade.id);

    const [mensagem] = await mensagensDe(unidade.id);
    expect(mensagem.template).toBe("mensalidade_vencida");
  });

  it("não cobra quem já pagou", async () => {
    const { unidade, aluno } = await cenario();
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(HOJE), -5), "PAGA");

    expect((await regua.execute(HOJE, unidade.id)).enviadas).toBe(0);
  });

  it("rodar de novo no dia seguinte não repete a mesma cobrança", async () => {
    const { unidade, aluno } = await cenario();
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(HOJE), -5));

    const primeira = await regua.execute(HOJE, unidade.id);
    const segunda = await regua.execute(somarDiasUTC(HOJE, 1), unidade.id);

    expect(primeira.enviadas).toBe(1);
    expect(segunda.enviadas).toBe(0);
    expect(segunda.jaAvisadas).toBe(1);
    expect(await mensagensDe(unidade.id)).toHaveLength(1);
  });

  it("sem consentimento, registra o bloqueio e não envia", async () => {
    const { unidade, aluno } = await cenario({ comConsentimento: false });
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(HOJE), -1));

    const resultado = await regua.execute(HOJE, unidade.id);

    expect(resultado.enviadas).toBe(0);
    expect(resultado.semConsentimento).toBe(1);

    const [mensagem] = await mensagensDe(unidade.id);
    expect(mensagem.status).toBe("BLOQUEADA_SEM_CONSENTIMENTO");
  });

  it("roda de madrugada sem errar o dia", async () => {
    // 2h UTC ainda é o dia anterior em Brasília. Se o corte usasse
    // acessores locais, a mensalidade que vence daqui a 3 dias sairia da
    // janela e ninguém seria avisado.
    const { unidade, aluno } = await cenario();
    const madrugada = new Date("2026-09-10T02:00:00Z");
    await mensalidade(unidade.id, aluno.id, somarDiasUTC(inicioDoDiaUTC(madrugada), 3));

    expect((await regua.execute(madrugada, unidade.id)).enviadas).toBe(1);
  });
});

describe("aviso de entrada e saída", () => {
  async function evento(unidadeId: number, alunoId: number, autorizado: boolean, sentido: "ENTRADA" | "SAIDA") {
    return prisma.eventoAcesso.create({
      data: {
        unidadeId,
        alunoId,
        autorizado,
        sentido,
        ocorridoEm: new Date("2026-09-10T22:05:00Z"), // 19:05 em Brasília
      },
    });
  }

  it("avisa a entrada com o horário do relógio da academia", async () => {
    const { unidade, aluno } = await cenario();
    const registro = await evento(unidade.id, aluno.id, true, "ENTRADA");

    expect(await avisarAcesso.execute(registro.id)).toBe("ENVIADA");

    const [mensagem] = await mensagensDe(unidade.id);
    expect(mensagem.template).toBe("entrada_aluno");
    expect(mensagem.parametros).toEqual(["Joana", "19:05"]);
  });

  it("avisa a saída com o template certo", async () => {
    const { unidade, aluno } = await cenario();
    const registro = await evento(unidade.id, aluno.id, true, "SAIDA");

    await avisarAcesso.execute(registro.id);

    const [mensagem] = await mensagensDe(unidade.id);
    expect(mensagem.template).toBe("saida_aluno");
  });

  it("NÃO avisa acesso negado", async () => {
    // susto no responsável sem ele poder fazer nada — é assunto da
    // recepção, não da família.
    const { unidade, aluno } = await cenario();
    const registro = await evento(unidade.id, aluno.id, false, "ENTRADA");

    expect(await avisarAcesso.execute(registro.id)).toBe("IGNORADO");
    expect(await mensagensDe(unidade.id)).toHaveLength(0);
  });

  it("reprocessar o mesmo evento não manda dois 'chegou'", async () => {
    const { unidade, aluno } = await cenario();
    const registro = await evento(unidade.id, aluno.id, true, "ENTRADA");

    await avisarAcesso.execute(registro.id);
    expect(await avisarAcesso.execute(registro.id)).toBe("JA_ENVIADA");
    expect(await mensagensDe(unidade.id)).toHaveLength(1);
  });

  it("evento de funcionário (sem aluno) é ignorado", async () => {
    const { unidade } = await cenario();
    const registro = await prisma.eventoAcesso.create({
      data: { unidadeId: unidade.id, autorizado: true, sentido: "ENTRADA" },
    });

    expect(await avisarAcesso.execute(registro.id)).toBe("IGNORADO");
  });
});

describe("lembrete de aula", () => {
  const HOJE = new Date("2026-09-14T12:00:00Z");

  async function aulaDeHoje(unidadeId: number, alunoId: number, status = "PENDENTE") {
    const turma = await prisma.turma.create({
      data: {
        unidadeId,
        nome: "Jiu-Jitsu Kids",
        faixaEtaria: "Kids",
        diasSemana: [1],
        horarioInicio: "19:00",
        horarioFim: "20:00",
        alunos: { connect: { id: alunoId } },
      },
    });

    return prisma.aulaProgramada.create({
      data: { unidadeId, turmaId: turma.id, data: inicioDoDiaUTC(HOJE), status },
    });
  }

  it("lembra o responsável da aula de hoje", async () => {
    const { unidade, aluno } = await cenario();
    await aulaDeHoje(unidade.id, aluno.id);

    expect((await lembrete.execute(HOJE, unidade.id)).enviadas).toBe(1);

    const [mensagem] = await mensagensDe(unidade.id);
    expect(mensagem.template).toBe("lembrete_aula");
    expect(mensagem.parametros).toEqual(["Joana", "Jiu-Jitsu Kids", "19:00"]);
  });

  it("não lembra de aula cancelada", async () => {
    const { unidade, aluno } = await cenario();
    await aulaDeHoje(unidade.id, aluno.id, "CANCELADA");

    expect((await lembrete.execute(HOJE, unidade.id)).enviadas).toBe(0);
  });

  it("não lembra aluno desativado", async () => {
    const { unidade, aluno } = await cenario();
    await aulaDeHoje(unidade.id, aluno.id);
    await prisma.aluno.update({ where: { id: aluno.id }, data: { ativo: false } });

    expect((await lembrete.execute(HOJE, unidade.id)).enviadas).toBe(0);
  });

  it("rodar duas vezes no mesmo dia não manda dois lembretes", async () => {
    const { unidade, aluno } = await cenario();
    await aulaDeHoje(unidade.id, aluno.id);

    await lembrete.execute(HOJE, unidade.id);
    const segunda = await lembrete.execute(HOJE, unidade.id);

    expect(segunda.enviadas).toBe(0);
    expect(segunda.jaAvisadas).toBe(1);
  });

  it("não lembra de aula de outro dia", async () => {
    const { unidade, aluno } = await cenario();
    await aulaDeHoje(unidade.id, aluno.id);

    expect((await lembrete.execute(somarDiasUTC(HOJE, 1), unidade.id)).enviadas).toBe(0);
  });
});
