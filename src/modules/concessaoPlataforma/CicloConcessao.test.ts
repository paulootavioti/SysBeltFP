import { generateKeyPairSync, sign } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../../app";
import { prisma } from "../../shared/database/prisma";
import { logger } from "../../shared/observability/logger";
import { payloadConcessao, type ConcessaoV1 } from "./concessaoContrato";
import { tenantTemRecurso } from "./recursos";

// Ciclo de vida da concessão pela rota que o Control Plane chama:
// emissão, reenvio, renovação, suspensão, expiração e as recusas.

const PREFIXO = "TESTE_CICLO_CONCESSAO_";
const chaves = generateKeyPairSync("ed25519");
const outraChave = generateKeyPairSync("ed25519");
const PUBLICA = chaves.publicKey.export({ type: "spki", format: "pem" }).toString();

let servidor: Server;
let base: string;
let conta: { id: number; tenantKey: string };
let unidadeId: number;

const HORA = 60 * 60_000;

function concessao(dados: Partial<ConcessaoV1> = {}, chavePrivada = chaves.privateKey): ConcessaoV1 {
  const agora = Date.now();
  const semAssinatura: ConcessaoV1 = {
    versao: 1,
    tenantKey: conta.tenantKey,
    revisao: 1,
    statusAcesso: "ATIVO",
    recursos: ["WHATSAPP", "CONTROLE_ACESSO"],
    emitidaEm: new Date(agora - HORA).toISOString(),
    expiraEm: new Date(agora + 24 * HORA).toISOString(),
    assinatura: "",
    ...dados,
  };
  return { ...semAssinatura, assinatura: sign(null, Buffer.from(payloadConcessao(semAssinatura)), chavePrivada).toString("base64") };
}

async function enviar(corpo: unknown) {
  const resposta = await fetch(`${base}/integracao/control-plane/v1/concessao`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return { status: resposta.status, corpo: await resposta.json() };
}

const gravada = () => prisma.concessaoPlataforma.findUnique({ where: { contaId: conta.id } });

async function limpar() {
  await prisma.concessaoPlataforma.deleteMany({ where: { conta: { nome: { startsWith: PREFIXO } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

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
  vi.stubEnv("CONTROL_PLANE_GRANT_PUBLIC_KEY", PUBLICA);
  conta = await prisma.conta.create({ data: { nome: `${PREFIXO}ACADEMIA` }, select: { id: true, tenantKey: true } });
  unidadeId = (await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}MATRIZ` } })).id;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("emissão e reenvio", () => {
  it("concessão válida é gravada e libera os recursos dela", async () => {
    const { status, corpo } = await enviar(concessao());

    expect(status).toBe(201);
    expect(corpo).toEqual({ revisao: 1, duplicada: false });
    expect(await tenantTemRecurso("WHATSAPP", new Date(), prisma, unidadeId)).toBe(true);
    expect(await tenantTemRecurso("GATEWAY_AUTOMATICO", new Date(), prisma, unidadeId)).toBe(false);
  });

  it("cada conta guarda a própria concessão (não há linha única no banco)", async () => {
    const primeira = conta;
    await enviar(concessao());
    conta = await prisma.conta.create({ data: { nome: `${PREFIXO}SEGUNDA` }, select: { id: true, tenantKey: true } });

    const { status } = await enviar(concessao());

    expect(status).toBe(201);
    expect(await prisma.concessaoPlataforma.count({ where: { contaId: { in: [primeira.id, conta.id] } } })).toBe(2);
  });

  it("reenvio idêntico é aceito sem regravar", async () => {
    const mesma = concessao();
    await enviar(mesma);

    const { status, corpo } = await enviar(mesma);

    expect(status).toBe(200);
    expect(corpo).toEqual({ revisao: 1, duplicada: true });
  });
});

describe("renovação e suspensão", () => {
  it("revisão nova substitui a anterior sem janela sem acesso", async () => {
    await enviar(concessao({ revisao: 1 }));
    const novaValidade = new Date(Date.now() + 30 * 24 * HORA).toISOString();

    expect(await tenantTemRecurso("WHATSAPP", new Date(), prisma, unidadeId)).toBe(true);
    const { status } = await enviar(concessao({ revisao: 2, expiraEm: novaValidade }));
    expect(await tenantTemRecurso("WHATSAPP", new Date(), prisma, unidadeId)).toBe(true);

    expect(status).toBe(201);
    expect(await gravada()).toMatchObject({ revisao: 2, expiraEm: new Date(novaValidade) });
  });

  it("suspensão corta os recursos imediatamente", async () => {
    await enviar(concessao({ revisao: 1 }));

    const { status } = await enviar(concessao({ revisao: 2, statusAcesso: "SUSPENSO" }));

    expect(status).toBe(201);
    expect(await tenantTemRecurso("WHATSAPP", new Date(), prisma, unidadeId)).toBe(false);
  });

  it("concessão gravada deixa de valer quando expira, sem precisar de nova chamada", async () => {
    await enviar(concessao({ expiraEm: new Date(Date.now() + HORA).toISOString() }));

    expect(await tenantTemRecurso("WHATSAPP", new Date(), prisma, unidadeId)).toBe(true);
    expect(await tenantTemRecurso("WHATSAPP", new Date(Date.now() + 2 * HORA), prisma, unidadeId)).toBe(false);
  });
});

describe("recusas", () => {
  it.each([
    ["expirada", () => concessao({ emitidaEm: new Date(Date.now() - 48 * HORA).toISOString(), expiraEm: new Date(Date.now() - HORA).toISOString() })],
    ["adulterada", () => ({ ...concessao(), recursos: ["WHATSAPP", "CONTROLE_ACESSO", "GATEWAY_AUTOMATICO"] })],
    ["assinada com outra chave", () => concessao({}, outraChave.privateKey)],
    ["de tenant desconhecido", () => concessao({ tenantKey: "6f1c1e0c-5a0e-4d4f-9a8e-2c1d3b4a5f60" })],
    ["emitida mais de 5 minutos no futuro", () => concessao({ emitidaEm: new Date(Date.now() + 6 * 60_000).toISOString() })],
  ])("%s: 401, nada gravado e motivo no log", async (_caso, montar) => {
    const aviso = vi.spyOn(logger, "warn");

    const { status } = await enviar(montar());

    expect(status).toBe(401);
    expect(await gravada()).toBeNull();
    expect(aviso).toHaveBeenCalledWith("concessao_rejeitada", expect.objectContaining({ motivo: expect.any(String) }));
  });

  it("tolera relógio do Control Plane até 5 minutos adiantado", async () => {
    const { status } = await enviar(concessao({ emitidaEm: new Date(Date.now() + 4 * 60_000).toISOString() }));

    expect(status).toBe(201);
  });

  it("revisão mais antiga que a gravada: 409 e a atual continua", async () => {
    await enviar(concessao({ revisao: 2 }));

    const { status } = await enviar(concessao({ revisao: 1, statusAcesso: "SUSPENSO" }));

    expect(status).toBe(409);
    expect(await gravada()).toMatchObject({ revisao: 2, statusAcesso: "ATIVO" });
  });

  it("mesma revisão com conteúdo diferente: 409", async () => {
    await enviar(concessao({ revisao: 3 }));

    const { status } = await enviar(concessao({ revisao: 3, recursos: ["WHATSAPP"] }));

    expect(status).toBe(409);
  });

  it("corpo fora do contrato: 400", async () => {
    const { status } = await enviar({ ...concessao(), campoExtra: true });

    expect(status).toBe(400);
  });
});
