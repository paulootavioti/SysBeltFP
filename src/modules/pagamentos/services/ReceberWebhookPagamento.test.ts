import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { ReceberWebhookPagamentoService } from "./ReceberWebhookPagamentoService";
import type { PaymentGateway, WebhookEvento } from "../gateways/PaymentGateway";

const service = new ReceberWebhookPagamentoService();

const PREFIXO = "TESTE_WEBHOOK_";

async function limpar() {
  await prisma.eventoWebhookPagamento.deleteMany({ where: { gateway: "TESTE" } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.mensalidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

// Gateway de mentira: devolve o evento já normalizado, que é exatamente o
// que o gateway real devolve depois de reler o pagamento na API dele.
function gatewayFalso(evento: Partial<WebhookEvento>): PaymentGateway {
  return {
    nome: "Teste",
    criarCobranca: async () => ({ gatewayId: "x", status: "pending" }),
    criarAssinatura: async () => ({ gatewayAssinaturaId: "x", status: "ATIVA" }),
    cancelarAssinatura: async () => {},
    estornar: async () => {},
    consultarStatus: async () => "approved",
    processarWebhook: async (payload) => ({
      tipo: "payment.updated",
      payload,
      eventoExternoId: "evt-1",
      recursoId: "pay-1",
      situacao: "PAGO",
      ...evento,
    }),
  };
}

async function criarMensalidade(valor = 150) {
  const unidade = await prisma.unidade.create({ data: { nome: `${PREFIXO}UNIDADE` } });

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}ALUNO`,
      dataNascimento: new Date("2010-01-01"),
    },
  });

  return prisma.mensalidade.create({
    data: {
      unidadeId: unidade.id,
      alunoId: aluno.id,
      valor,
      valorFinal: valor,
      vencimento: new Date("2026-08-10"),
      status: "ABERTA",
    },
  });
}

async function receber(evento: Partial<WebhookEvento>) {
  return service.execute({
    gateway: gatewayFalso(evento),
    nomeGateway: "TESTE",
    payload: { id: 1, type: "payment" },
  });
}

describe("baixa de mensalidade por webhook", () => {
  it("marca como paga e registra o valor que entrou de fato", async () => {
    const mensalidade = await criarMensalidade(150);

    const desfecho = await receber({
      referenciaExterna: String(mensalidade.id),
      valorPago: 142.5,
    });

    expect(desfecho.resultado).toBe("PAGAMENTO_REGISTRADO");

    const depois = await prisma.mensalidade.findUnique({ where: { id: mensalidade.id } });
    expect(depois?.status).toBe("PAGA");
    expect(depois?.valorFinal).toBe(142.5);
    expect(depois?.dataPagamento).not.toBeNull();
  });

  it("deixa rastro na auditoria dizendo que veio de webhook", async () => {
    const mensalidade = await criarMensalidade();

    await receber({ referenciaExterna: String(mensalidade.id) });

    const log = await prisma.auditLog.findFirst({
      where: { entidade: "Mensalidade", entidadeId: mensalidade.id, operacao: "PAGAMENTO" },
    });

    expect(log).not.toBeNull();
    expect((log?.valoresDepois as { origem?: string })?.origem).toBe("webhook");
  });
});

describe("idempotência", () => {
  it("o mesmo evento reenviado não dá baixa duas vezes", async () => {
    const mensalidade = await criarMensalidade();

    const primeira = await receber({ referenciaExterna: String(mensalidade.id) });
    const segunda = await receber({ referenciaExterna: String(mensalidade.id) });

    expect(primeira.resultado).toBe("PAGAMENTO_REGISTRADO");
    // reenvio é o comportamento NORMAL do gateway quando não recebe 200.
    expect(segunda.resultado).toBe("JA_PROCESSADO");

    const logs = await prisma.auditLog.count({
      where: { entidade: "Mensalidade", entidadeId: mensalidade.id, operacao: "PAGAMENTO" },
    });
    expect(logs).toBe(1);
  });

  it("dois webhooks simultâneos do mesmo evento: só um aplica", async () => {
    const mensalidade = await criarMensalidade();

    // é a corrida real: o gateway reenvia antes de o primeiro terminar.
    const [a, b] = await Promise.all([
      receber({ referenciaExterna: String(mensalidade.id) }),
      receber({ referenciaExterna: String(mensalidade.id) }),
    ]);

    const resultados = [a.resultado, b.resultado].sort();
    expect(resultados).toEqual(["JA_PROCESSADO", "PAGAMENTO_REGISTRADO"]);

    const logs = await prisma.auditLog.count({
      where: { entidade: "Mensalidade", entidadeId: mensalidade.id, operacao: "PAGAMENTO" },
    });
    expect(logs).toBe(1);
  });

  it("guarda o payload cru pra conciliação", async () => {
    const mensalidade = await criarMensalidade();

    await receber({ referenciaExterna: String(mensalidade.id) });

    const evento = await prisma.eventoWebhookPagamento.findFirst({ where: { gateway: "TESTE" } });

    expect(evento?.payload).toEqual({ id: 1, type: "payment" });
    expect(evento?.processadoEm).not.toBeNull();
    expect(evento?.resultado).toBe("PAGAMENTO_REGISTRADO");
  });
});

describe("situações que não devem dar baixa", () => {
  it("pagamento pendente não marca como paga", async () => {
    const mensalidade = await criarMensalidade();

    const desfecho = await receber({
      referenciaExterna: String(mensalidade.id),
      situacao: "PENDENTE",
    });

    expect(desfecho.resultado).toBe("IGNORADO");
    expect((await prisma.mensalidade.findUnique({ where: { id: mensalidade.id } }))?.status).toBe("ABERTA");
  });

  it("pagamento recusado não marca como paga", async () => {
    const mensalidade = await criarMensalidade();

    await receber({ referenciaExterna: String(mensalidade.id), situacao: "RECUSADO" });

    expect((await prisma.mensalidade.findUnique({ where: { id: mensalidade.id } }))?.status).toBe("ABERTA");
  });

  it("mensalidade cancelada não é reaberta sozinha", async () => {
    const mensalidade = await criarMensalidade();
    await prisma.mensalidade.update({
      where: { id: mensalidade.id },
      data: { status: "CANCELADA" },
    });

    const desfecho = await receber({ referenciaExterna: String(mensalidade.id) });

    expect(desfecho.resultado).toBe("IGNORADO");
    expect(desfecho.detalhe).toMatch(/manual/i);
    expect((await prisma.mensalidade.findUnique({ where: { id: mensalidade.id } }))?.status).toBe(
      "CANCELADA"
    );
  });

  it("referência que não aponta pra mensalidade nenhuma não quebra", async () => {
    const desfecho = await receber({ referenciaExterna: "999999" });

    expect(desfecho.resultado).toBe("MENSALIDADE_NAO_ENCONTRADA");
  });

  it("notificação sem referência é ignorada, não estourada", async () => {
    // ids distintos: com o mesmo id o segundo cairia na deduplicação e o
    // teste passaria pelo motivo errado.
    expect(
      (await receber({ eventoExternoId: "evt-sem-ref", referenciaExterna: undefined })).resultado
    ).toBe("IGNORADO");
    expect(
      (await receber({ eventoExternoId: "evt-ref-invalida", referenciaExterna: "abc" })).resultado
    ).toBe("IGNORADO");
  });

  it("notificação sem id de evento não é processada — não há como deduplicar", async () => {
    const mensalidade = await criarMensalidade();

    const desfecho = await receber({
      referenciaExterna: String(mensalidade.id),
      eventoExternoId: undefined,
    });

    expect(desfecho.resultado).toBe("IGNORADO");
    expect((await prisma.mensalidade.findUnique({ where: { id: mensalidade.id } }))?.status).toBe("ABERTA");
  });
});
