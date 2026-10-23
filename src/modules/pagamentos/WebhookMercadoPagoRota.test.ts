import { createHmac, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app";
import { prisma } from "../../shared/database/prisma";
import { prepararConfiguracaoParaGravar } from "./gateways/credenciais";
import { montarManifesto } from "./gateways/mercadoPago/assinaturaWebhook";
import notificacao from "./gateways/mercadoPago/fixtures/notificacao-payment.json";
import aprovado from "./gateways/mercadoPago/fixtures/pagamento-aprovado.json";
import pendente from "./gateways/mercadoPago/fixtures/pagamento-pendente.json";
import emProcessamento from "./gateways/mercadoPago/fixtures/pagamento-em-processamento.json";
import recusado from "./gateways/mercadoPago/fixtures/pagamento-recusado.json";
import cancelado from "./gateways/mercadoPago/fixtures/pagamento-cancelado.json";
import estornado from "./gateways/mercadoPago/fixtures/pagamento-estornado.json";
import recorrente from "./gateways/mercadoPago/fixtures/pagamento-recorrente-aprovado.json";

// Homologação do webhook do Mercado Pago pela rota de verdade: assinatura
// x-signature, consulta do pagamento na API (simulada com respostas no
// formato real, em fixtures/) e efeito no banco. Duas academias em contas
// diferentes, cada uma com a própria conta do Mercado Pago.

const PREFIXO = "TESTE_MP_ROTA_";

// formato de GET /v1/payments/:id; os campos variam conforme o status
type Pagamento = Record<string, unknown>;

interface RespostaWebhook {
  resultado?: string;
  detalhe?: string;
}

interface Academia {
  formaPagamentoId: number;
  mensalidadeId: number;
  unidadeId: number;
  token: string;
  segredo: string;
}

// pagamentos que a "API do Mercado Pago" devolve, por token da conta
const pagamentosPorToken = new Map<string, Pagamento>();
const fetchReal = globalThis.fetch;
const eventos: string[] = [];
let servidor: Server;
let base: string;

async function limpar() {
  await prisma.eventoWebhookPagamento.deleteMany({ where: { eventoExternoId: { in: eventos } } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.mensalidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.formaPagamento.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

async function academia(nome: string): Promise<Academia> {
  const token = `APP_USR-${nome}-${randomUUID()}`;
  const segredo = `segredo-${nome}-${randomUUID()}`;
  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}${nome}` } });
  const unidade = await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}${nome}` } });
  const aluno = await prisma.aluno.create({
    data: { unidadeId: unidade.id, nome: `${PREFIXO}${nome} Aluno`, dataNascimento: new Date("2010-01-01") },
  });
  const forma = await prisma.formaPagamento.create({
    data: {
      unidadeId: unidade.id,
      tipo: "PIX",
      configuracao: prepararConfiguracaoParaGravar(
        { gateway: "MERCADO_PAGO", credenciais: { accessToken: token, webhookSecret: segredo } },
        null,
      ) as object,
    },
  });
  const mensalidade = await prisma.mensalidade.create({
    data: {
      unidadeId: unidade.id,
      alunoId: aluno.id,
      formaPagamentoId: forma.id,
      valor: 150,
      valorFinal: 150,
      vencimento: new Date("2026-10-10"),
      status: "ABERTA",
    },
  });
  return { formaPagamentoId: forma.id, mensalidadeId: mensalidade.id, unidadeId: unidade.id, token, segredo };
}

/** A conta do Mercado Pago de `dona` passa a devolver `pagamento` para a referência informada. */
function naContaDe(dona: Academia, pagamento: Pagamento, referencia: string | number) {
  pagamentosPorToken.set(dona.token, { ...pagamento, external_reference: String(referencia) });
}

function assinar(segredo: string, dataId: string, requestId: string, ts = Date.now()) {
  const manifesto = montarManifesto({ recursoId: dataId, requestId, ts: String(ts) });
  return `ts=${ts},v1=${createHmac("sha256", segredo).update(manifesto).digest("hex")}`;
}

/** Envia a notificação como o Mercado Pago envia. `segredo: null` manda sem assinatura. */
async function notificar(destino: Academia, opcoes: { segredo?: string | null; eventoId?: string } = {}) {
  const eventoId = opcoes.eventoId ?? String(Date.now()) + Math.floor(Math.random() * 1e6);
  eventos.push(eventoId);
  const dataId = notificacao.data.id;
  const requestId = randomUUID();
  const segredo = opcoes.segredo === undefined ? destino.segredo : opcoes.segredo;
  const resposta = await fetchReal(`${base}/pagamentos/webhook/mercado_pago/${destino.formaPagamentoId}?data.id=${dataId}&type=payment`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId,
      ...(segredo ? { "x-signature": assinar(segredo, dataId, requestId) } : {}),
    },
    body: JSON.stringify({ ...notificacao, id: eventoId }),
  });
  return { status: resposta.status, corpo: (await resposta.json()) as RespostaWebhook, eventoId };
}

const statusDa = async (academia: Academia) =>
  (await prisma.mensalidade.findUniqueOrThrow({ where: { id: academia.mensalidadeId } })).status;

beforeAll(async () => {
  servidor = await new Promise((pronto) => {
    const s = app.listen(0, () => pronto(s));
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await limpar();
  await new Promise((fechado) => servidor.close(() => fechado(null)));
});

beforeEach(async () => {
  await limpar();
  pagamentosPorToken.clear();
  // Simula a API do Mercado Pago: responde pela conta dona do token usado.
  vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
    if (!String(url).startsWith("https://api.mercadopago.com/v1/payments/")) return fetchReal(url, init);
    const token = String(new Headers(init?.headers).get("authorization")).replace("Bearer ", "");
    const pagamento = pagamentosPorToken.get(token);
    return new Response(JSON.stringify(pagamento ?? { message: "not_found" }), { status: pagamento ? 200 : 404 });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("webhook Mercado Pago — autenticação", () => {
  it("sem x-signature: 401 e nada muda", async () => {
    const alfa = await academia("ALFA");
    naContaDe(alfa, aprovado, alfa.mensalidadeId);

    const { status, eventoId } = await notificar(alfa, { segredo: null });

    expect(status).toBe(401);
    expect(await statusDa(alfa)).toBe("ABERTA");
    expect(await prisma.eventoWebhookPagamento.count({ where: { eventoExternoId: eventoId } })).toBe(0);
  });

  it("assinada com o segredo de outra academia: 401 e nada muda", async () => {
    const [alfa, beta] = [await academia("ALFA"), await academia("BETA")];
    naContaDe(alfa, aprovado, alfa.mensalidadeId);

    const { status } = await notificar(alfa, { segredo: beta.segredo });

    expect(status).toBe(401);
    expect(await statusDa(alfa)).toBe("ABERTA");
  });
});

describe("webhook Mercado Pago — efeito de cada status", () => {
  it("aprovado: dá baixa com o valor pago e deixa auditoria, consultando a conta da própria academia", async () => {
    const alfa = await academia("ALFA");
    naContaDe(alfa, aprovado, alfa.mensalidadeId);

    const { status, corpo } = await notificar(alfa);

    expect(status).toBe(200);
    expect(corpo.resultado).toBe("PAGAMENTO_REGISTRADO");
    const mensalidade = await prisma.mensalidade.findUniqueOrThrow({ where: { id: alfa.mensalidadeId } });
    expect(mensalidade).toMatchObject({ status: "PAGA", valorFinal: 150 });
    expect(await prisma.auditLog.count({ where: { entidade: "Mensalidade", entidadeId: alfa.mensalidadeId, origemSistema: "webhook:MERCADO_PAGO" } })).toBe(1);
  });

  it.each([
    ["pendente", pendente],
    ["em processamento", emProcessamento],
    ["recusado", recusado],
    ["cancelado", cancelado],
    ["estornado", estornado],
  ])("%s: responde 200 e a mensalidade continua em aberto", async (_nome, pagamento) => {
    const alfa = await academia("ALFA");
    naContaDe(alfa, pagamento, alfa.mensalidadeId);

    const { status, corpo } = await notificar(alfa);

    expect(status).toBe(200);
    expect(corpo.resultado).toBe("IGNORADO");
    expect(await statusDa(alfa)).toBe("ABERTA");
  });
});

describe("webhook Mercado Pago — idempotência", () => {
  it("o mesmo evento reenviado é aceito sem efeito duplicado", async () => {
    const alfa = await academia("ALFA");
    naContaDe(alfa, aprovado, alfa.mensalidadeId);

    const primeiro = await notificar(alfa);
    const segundo = await notificar(alfa, { eventoId: primeiro.eventoId });

    expect([primeiro.corpo.resultado, segundo.corpo.resultado]).toEqual(["PAGAMENTO_REGISTRADO", "JA_PROCESSADO"]);
    expect(segundo.status).toBe(200);
    expect(await prisma.auditLog.count({ where: { entidade: "Mensalidade", entidadeId: alfa.mensalidadeId } })).toBe(1);
  });

  it("entregas simultâneas do mesmo evento: só uma aplica", async () => {
    const alfa = await academia("ALFA");
    naContaDe(alfa, aprovado, alfa.mensalidadeId);
    const eventoId = `simultaneo-${randomUUID()}`;

    const respostas = await Promise.all([1, 2, 3].map(() => notificar(alfa, { eventoId })));

    expect(respostas.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(respostas.filter((r) => r.corpo.resultado === "PAGAMENTO_REGISTRADO")).toHaveLength(1);
    expect(await prisma.auditLog.count({ where: { entidade: "Mensalidade", entidadeId: alfa.mensalidadeId } })).toBe(1);
  });
});

describe("webhook Mercado Pago — isolamento entre assinantes", () => {
  it("pagamento na conta de uma academia não dá baixa em mensalidade de outra", async () => {
    const [alfa, beta] = [await academia("ALFA"), await academia("BETA")];
    // ALFA cria, na própria conta do Mercado Pago, um pagamento aprovado
    // cuja referência é a mensalidade da BETA — e assina com o segredo dela mesma.
    naContaDe(alfa, aprovado, beta.mensalidadeId);

    const { status, corpo } = await notificar(alfa);

    expect(status).toBe(200);
    expect(corpo).toMatchObject({ resultado: "IGNORADO", detalhe: "Referência de outra conta." });
    expect(await statusDa(beta)).toBe("ABERTA");
  });

  it("pagamento recorrente de assinatura não é confundido com a mensalidade de mesmo número", async () => {
    const alfa = await academia("ALFA");
    // Assinaturas antigas mandavam o id da assinatura como referência; aqui
    // ele coincide com o id de uma mensalidade em aberto.
    naContaDe(alfa, recorrente, alfa.mensalidadeId);

    const { corpo } = await notificar(alfa);

    expect(corpo.resultado).toBe("IGNORADO");
    expect(await statusDa(alfa)).toBe("ABERTA");
  });
});
