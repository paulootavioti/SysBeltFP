import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { EnviarMensagemWhatsappService } from "./EnviarMensagemWhatsappService";
import { AtualizarEntregaService } from "./AtualizarEntregaService";
import { RegistrarConsentimentoService } from "../../consentimentos/services/RegistrarConsentimentoService";
import { MetaCloudApiProvider } from "../providers/MetaCloudApiProvider";
import { normalizarTelefoneBR } from "../utils/telefone";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const enviar = new EnviarMensagemWhatsappService(async () => true);
const atualizar = new AtualizarEntregaService();
const registrarConsentimento = new RegistrarConsentimentoService();

const PREFIXO = "TESTE_ZAP_";

async function limpar() {
  await prisma.mensagemWhatsapp.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.consentimento.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_zap_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.assinaturaPlataforma.deleteMany({
    where: { conta: { nome: { startsWith: PREFIXO } } },
  });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.planoPlataforma.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function criarCenario() {
  const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE`);

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}ALUNO`,
      dataNascimento: new Date("2015-01-01"),
    },
  });

  const usuario = await prisma.usuario.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}RECEP`,
      email: "teste_zap_recep@x.com",
      senha: "x",
      perfil: "RECEPCAO",
    },
  });

  return { unidade, aluno, usuario };
}

async function liberarComunicacoes(unidadeId: number, alunoId: number, usuarioId: number) {
  await registrarConsentimento.execute(
    { alunoId, tipo: "COMUNICACOES", concedido: true },
    unidadeId,
    usuarioId
  );
}

describe("normalizarTelefoneBR", () => {
  it("aceita as formas que aparecem no cadastro", () => {
    expect(normalizarTelefoneBR("(11) 98765-4321")).toBe("5511987654321");
    expect(normalizarTelefoneBR("11987654321")).toBe("5511987654321");
    expect(normalizarTelefoneBR("+55 11 98765-4321")).toBe("5511987654321");
    expect(normalizarTelefoneBR("11 3456 7890")).toBe("551134567890");
  });

  it("recusa número incompleto em vez de chutar", () => {
    // completar com chute poderia mandar mensagem da academia pro
    // WhatsApp de um desconhecido.
    expect(normalizarTelefoneBR("98765-4321")).toBeNull();
    expect(normalizarTelefoneBR("123")).toBeNull();
    expect(normalizarTelefoneBR("")).toBeNull();
    expect(normalizarTelefoneBR(null)).toBeNull();
  });
});

describe("consentimento é pré-requisito", () => {
  it("não envia sem consentimento de comunicações, mas registra a tentativa", async () => {
    const { unidade, aluno } = await criarCenario();

    const resultado = await enviar.execute({
      unidadeId: unidade.id,
      alunoId: aluno.id,
      template: "MENSALIDADE_VENCIDA",
      parametros: ["Maria", "João", "10/08/2026", "150,00"],
      telefone: "(11) 98765-4321",
      chaveIdempotencia: "mensalidade-1-vencida",
    });

    expect(resultado.resultado).toBe("SEM_CONSENTIMENTO");

    // o bloqueio fica registrado: some do envio, não da história.
    const registro = await prisma.mensagemWhatsapp.findFirst({
      where: { chaveIdempotencia: "mensalidade-1-vencida" },
    });
    expect(registro?.status).toBe("BLOQUEADA_SEM_CONSENTIMENTO");
  });

  it("envia quando há consentimento", async () => {
    const { unidade, aluno, usuario } = await criarCenario();
    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    const resultado = await enviar.execute({
      unidadeId: unidade.id,
      alunoId: aluno.id,
      template: "ENTRADA_ALUNO",
      parametros: ["João", "18:02"],
      telefone: "11987654321",
      chaveIdempotencia: "entrada-1",
    });

    expect(resultado.resultado).toBe("ENVIADA");

    const registro = await prisma.mensagemWhatsapp.findFirst({
      where: { chaveIdempotencia: "entrada-1" },
    });
    expect(registro?.status).toBe("ENVIADA");
    expect(registro?.telefone).toBe("5511987654321");
    expect(registro?.provedorMensagemId).toBeTruthy();
  });
});

describe("não repetir aviso", () => {
  it("o mesmo fato não vira duas mensagens", async () => {
    const { unidade, aluno, usuario } = await criarCenario();
    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    const dados = {
      unidadeId: unidade.id,
      alunoId: aluno.id,
      template: "MENSALIDADE_VENCIDA" as const,
      parametros: ["Maria", "João", "10/08/2026", "150,00"],
      telefone: "11987654321",
      chaveIdempotencia: "mensalidade-77-vencida",
    };

    expect((await enviar.execute(dados)).resultado).toBe("ENVIADA");
    // rodar a régua de cobrança de novo não deve encher o WhatsApp.
    expect((await enviar.execute(dados)).resultado).toBe("JA_ENVIADA");

    expect(
      await prisma.mensagemWhatsapp.count({ where: { chaveIdempotencia: dados.chaveIdempotencia } })
    ).toBe(1);
  });

  it("duas rodadas simultâneas: só uma mensagem sai", async () => {
    const { unidade, aluno, usuario } = await criarCenario();
    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    const dados = {
      unidadeId: unidade.id,
      alunoId: aluno.id,
      template: "LEMBRETE_AULA" as const,
      parametros: ["João", "Jiu-Jitsu", "18:00"],
      telefone: "11987654321",
      chaveIdempotencia: "lembrete-aula-99",
    };

    const [a, b] = await Promise.all([enviar.execute(dados), enviar.execute(dados)]);

    expect([a.resultado, b.resultado].sort()).toEqual(["ENVIADA", "JA_ENVIADA"]);
  });
});

describe("telefone ausente", () => {
  it("não cria registro nem quebra a rodada", async () => {
    const { unidade, aluno, usuario } = await criarCenario();
    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    const resultado = await enviar.execute({
      unidadeId: unidade.id,
      alunoId: aluno.id,
      template: "LEMBRETE_AULA",
      parametros: ["João", "Jiu-Jitsu", "18:00"],
      telefone: null,
      chaveIdempotencia: "sem-telefone-1",
    });

    expect(resultado.resultado).toBe("SEM_TELEFONE");
    expect(await prisma.mensagemWhatsapp.count({ where: { chaveIdempotencia: "sem-telefone-1" } })).toBe(0);
  });
});

describe("status de entrega", () => {
  async function mensagemEnviada() {
    const { unidade, aluno, usuario } = await criarCenario();
    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    await enviar.execute({
      unidadeId: unidade.id,
      alunoId: aluno.id,
      template: "ENTRADA_ALUNO",
      parametros: ["João", "18:02"],
      telefone: "11987654321",
      chaveIdempotencia: "entrada-status",
    });

    const registro = await prisma.mensagemWhatsapp.findFirstOrThrow({
      where: { chaveIdempotencia: "entrada-status" },
    });

    return registro;
  }

  it("avança de enviada para entregue e depois lida", async () => {
    const registro = await mensagemEnviada();
    const id = registro.provedorMensagemId!;

    await atualizar.execute([
      { provedorMensagemId: id, situacao: "ENTREGUE", ocorridoEm: new Date() },
    ]);
    expect((await prisma.mensagemWhatsapp.findUnique({ where: { id: registro.id } }))?.status).toBe("ENTREGUE");

    await atualizar.execute([{ provedorMensagemId: id, situacao: "LIDA", ocorridoEm: new Date() }]);
    const final = await prisma.mensagemWhatsapp.findUnique({ where: { id: registro.id } });
    expect(final?.status).toBe("LIDA");
    expect(final?.lidaEm).not.toBeNull();
  });

  it("evento fora de ordem não faz o status andar pra trás", async () => {
    const registro = await mensagemEnviada();
    const id = registro.provedorMensagemId!;

    await atualizar.execute([{ provedorMensagemId: id, situacao: "LIDA", ocorridoEm: new Date() }]);
    // "entregue" chegando depois de "lida" é atraso de rede, não regressão.
    await atualizar.execute([{ provedorMensagemId: id, situacao: "ENTREGUE", ocorridoEm: new Date() }]);

    expect((await prisma.mensagemWhatsapp.findUnique({ where: { id: registro.id } }))?.status).toBe("LIDA");
  });

  it("status de mensagem que não é nossa é ignorado", async () => {
    const { aplicadas } = await atualizar.execute([
      { provedorMensagemId: "wamid.de-outro-sistema", situacao: "ENTREGUE", ocorridoEm: new Date() },
    ]);

    expect(aplicadas).toBe(0);
  });
});

describe("leitura do webhook da Meta", () => {
  const provedor = new MetaCloudApiProvider();

  it("extrai os status aninhados, com o timestamp em segundos", () => {
    const atualizacoes = provedor.interpretarWebhook({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: "wamid.A", status: "delivered", timestamp: "1786000000" },
                  { id: "wamid.B", status: "read", timestamp: "1786000060" },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(atualizacoes).toHaveLength(2);
    expect(atualizacoes[0].situacao).toBe("ENTREGUE");
    // segundos, não milissegundos — interpretar errado jogaria a data
    // pra 1970.
    expect(atualizacoes[0].ocorridoEm.getUTCFullYear()).toBe(2026);
    expect(atualizacoes[1].situacao).toBe("LIDA");
  });

  it("traz o motivo quando a entrega falha", () => {
    const [atualizacao] = provedor.interpretarWebhook({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: "wamid.C",
                    status: "failed",
                    timestamp: "1786000000",
                    errors: [{ title: "Recipient not opted in", message: "Sem opt-in" }],
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(atualizacao.situacao).toBe("FALHOU");
    expect(atualizacao.erro).toBe("Sem opt-in");
  });

  it("payload vazio ou de outro tipo de evento não quebra", () => {
    expect(provedor.interpretarWebhook({})).toEqual([]);
    expect(provedor.interpretarWebhook(null)).toEqual([]);
    // mensagem recebida (não status) não interessa a este fluxo.
    expect(
      provedor.interpretarWebhook({ entry: [{ changes: [{ value: { messages: [{ id: "x" }] } }] }] })
    ).toEqual([]);
  });
});

// O WhatsApp é vendido à parte. A fonte de verdade local agora é a
// concessão assinada, sem consulta à assinatura comercial legada.
describe("WhatsApp é recurso da concessão", () => {
  it("tenant sem o recurso não envia, e nada vai pro provedor", async () => {
    const bloqueado = new EnviarMensagemWhatsappService(async () => false);
    const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE_SEM`);

    const aluno = await prisma.aluno.create({
      data: {
        unidadeId: unidade.id,
        nome: `${PREFIXO}ALUNO_SEM`,
        dataNascimento: new Date("2015-01-01"),
      },
    });

    const usuario = await prisma.usuario.create({
      data: {
        unidadeId: unidade.id,
        nome: `${PREFIXO}RECEP_SEM`,
        email: "teste_zap_recep_sem@x.com",
        senha: "x",
        perfil: "RECEPCAO",
      },
    });

    // consentimento em dia: o que barra o envio é só a concessão.
    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    const resultado = await bloqueado.execute({
      unidadeId: unidade.id,
      template: "MENSALIDADE_VENCIDA",
      parametros: ["Fulano", "R$ 100,00", "01/08/2026"],
      telefone: "(41) 99999-8888",
      alunoId: aluno.id,
      chaveIdempotencia: `sem-recurso-${aluno.id}`,
    });

    expect(resultado.resultado).toBe("SEM_RECURSO_NO_PLANO");

    // não gera linha: concessão sem o recurso não é um fato sobre o aluno,
    // ao contrário da falta de consentimento.
    const registros = await prisma.mensagemWhatsapp.findMany({
      where: { unidadeId: unidade.id },
    });

    expect(registros).toHaveLength(0);
  });

  it("a trava vem antes do consentimento e do telefone", async () => {
    // ordem importa: sem o recurso, o sistema nem chega a avaliar o
    // consentimento — não faz sentido registrar bloqueio de LGPD numa
    // academia que não contratou o canal.
    const bloqueado = new EnviarMensagemWhatsappService(async () => false);
    const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE_ORDEM`);

    const resultado = await bloqueado.execute({
      unidadeId: unidade.id,
      template: "LEMBRETE_AULA",
      parametros: ["Fulano", "Jiu-Jitsu", "19:00"],
      telefone: null,
      chaveIdempotencia: `ordem-${unidade.id}`,
    });

    expect(resultado.resultado).toBe("SEM_RECURSO_NO_PLANO");
  });

  it("tenant com recurso concedido envia normalmente", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    await liberarComunicacoes(unidade.id, aluno.id, usuario.id);

    const resultado = await enviar.execute({
      unidadeId: unidade.id,
      template: "MENSALIDADE_VENCIDA",
      parametros: ["Fulano", "R$ 100,00", "01/08/2026"],
      telefone: "(41) 99999-8888",
      alunoId: aluno.id,
      chaveIdempotencia: `com-recurso-${aluno.id}`,
    });

    expect(resultado.resultado).toBe("ENVIADA");
  });
});
