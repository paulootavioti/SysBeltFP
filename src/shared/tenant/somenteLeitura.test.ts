import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../../app";
import { prisma } from "../database/prisma";
import { assinarTokenDaRequisicao } from "./tokenDaRequisicao";
import { MENSAGEM_SOMENTE_LEITURA } from "./somenteLeitura";

// Modo somente leitura pela rota real: academia com a concessão suspensa ou
// vencida consulta, mas não grava.

const PREFIXO = "TESTE_SOMENTE_LEITURA_";
const EMAIL = "teste_somente_leitura_";
const DIA = 24 * 60 * 60_000;

let servidor: Server;
let base: string;
let contaId: number;
let token: string;

async function limpar() {
  await prisma.solicitacaoSuporte.deleteMany({ where: { usuarioEmail: { startsWith: EMAIL } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: EMAIL } } });
  await prisma.concessaoPlataforma.deleteMany({ where: { conta: { nome: { startsWith: PREFIXO } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

async function concessao(statusAcesso: "ATIVO" | "SUSPENSO" | "CANCELADO", expiraEm: Date) {
  const conta = await prisma.conta.findUniqueOrThrow({ where: { id: contaId } });
  await prisma.concessaoPlataforma.create({
    data: {
      contaId, tenantKey: conta.tenantKey, statusAcesso, recursos: [], versaoContrato: 1, revisao: 1,
      emitidaEm: new Date(expiraEm.getTime() - 30 * DIA), expiraEm,
      payloadHash: "hash-de-teste", assinaturaBase64: "assinatura-de-teste",
    },
  });
}

async function requisitar(metodo: string, caminho: string, corpo?: unknown) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: resposta.status, corpo: (await resposta.json().catch(() => ({}))) as { message?: string } };
}

const cadastrarAluno = () => requisitar("POST", "/alunos", {});

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
  contaId = (await prisma.conta.create({ data: { nome: `${PREFIXO}ACADEMIA` } })).id;
  const unidade = await prisma.unidade.create({ data: { contaId, nome: `${PREFIXO}MATRIZ` } });
  const admin = await prisma.usuario.create({
    data: { nome: `${PREFIXO}ADMIN`, email: `${EMAIL}admin@x.com`, senha: "hash", perfil: "ADMIN", unidadeId: unidade.id },
  });
  token = assinarTokenDaRequisicao({ perfil: "ADMIN" }, { subject: String(admin.id) }, "sysbelt-web");
});

describe("academia com a concessão suspensa ou vencida", () => {
  it.each([
    ["suspensa", "SUSPENSO" as const, new Date(Date.now() + 30 * DIA)],
    ["cancelada", "CANCELADO" as const, new Date(Date.now() + 30 * DIA)],
    ["vencida", "ATIVO" as const, new Date(Date.now() - DIA)],
  ])("%s: consulta normalmente, mas não grava", async (_caso, status, expiraEm) => {
    await concessao(status, expiraEm);

    expect((await requisitar("GET", "/alunos")).status).toBe(200);

    const escrita = await cadastrarAluno();
    expect(escrita.status).toBe(403);
    expect(escrita.corpo.message).toBe(MENSAGEM_SOMENTE_LEITURA);
  });

  it("ainda consegue abrir chamado de suporte", async () => {
    await concessao("SUSPENSO", new Date(Date.now() + 30 * DIA));

    const { status } = await requisitar("POST", "/suporte", { mensagem: "Preciso regularizar a assinatura." });

    expect(status).toBe(201);
  });
});

describe("academia com acesso normal", () => {
  it("concessão ativa e válida: grava normalmente", async () => {
    await concessao("ATIVO", new Date(Date.now() + 30 * DIA));

    // passa da trava e para na validação do corpo vazio
    expect((await cadastrarAluno()).status).toBe(400);
  });

  it("conta ainda sem concessão (não provisionada): segue como antes", async () => {
    expect((await cadastrarAluno()).status).toBe(400);
  });
});

describe("mensagem", () => {
  it("diz o que aconteceu e o que fazer", () => {
    expect(MENSAGEM_SOMENTE_LEITURA).toContain("somente leitura");
    expect(MENSAGEM_SOMENTE_LEITURA).toContain("Regularize a assinatura");
  });
});
