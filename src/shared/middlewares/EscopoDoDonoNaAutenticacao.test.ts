import type { NextFunction, Request, Response } from "express";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../database/prisma";
import { comContextoRequisicao, obterContextoRequisicao } from "../context/contextoRequisicao";
import { assinarTokenDaRequisicao } from "../tenant/tokenDaRequisicao";
import { ensureAuthenticated } from "./ensureAuthenticated";

// O DONO não é fixado a uma unidade (RN-164) e alterna entre uma filial e
// "todas as unidades" pelo seletor (RN-165). "Todas" é o estado sem unidade
// ativa, e o front o pede apagando o X-Unidade-Id.
//
// Um DONO com filial gravada na linha dele ficaria preso nela: sem cabeçalho,
// a requisição caía no valor do banco. A autenticação normaliza isso, para
// que a regra não dependa de o cadastro ter gravado certo.

const PREFIXO = "TESTE_AUTHDONO_";
const EMAIL = "teste_authdono_";

let matrizId: number;
let filialId: number;

async function limpar() {
  await prisma.usuarioUnidade.deleteMany({
    where: { usuario: { email: { startsWith: EMAIL } } },
  });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: EMAIL } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(async () => {
  await limpar();

  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}Alfa` } });

  matrizId = (await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}Matriz` } })).id;
  filialId = (await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}Filial` } })).id;
});
afterAll(limpar);

async function criarUsuario(perfil: string, unidadeId: number | null, comVinculos = true) {
  return prisma.usuario.create({
    data: {
      nome: `${PREFIXO}${perfil}`,
      email: `${EMAIL}${perfil.toLowerCase()}@x.com`,
      senha: "hash",
      perfil,
      unidadeId,
      ...(comVinculos
        ? { unidadesVinculadas: { create: [{ unidadeId: matrizId }, { unidadeId: filialId }] } }
        : {}),
    },
  });
}

/** Roda o middleware e devolve o que ele deixou em `req.user` e no contexto. */
async function autenticar(usuarioId: number, cabecalhoUnidade?: number) {
  const token = assinarTokenDaRequisicao({}, { subject: String(usuarioId) }, "sysbelt-web");

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
      ...(cabecalhoUnidade ? { "x-unidade-id": String(cabecalhoUnidade) } : {}),
    },
  } as unknown as Request;

  return comContextoRequisicao({}, async () => {
    await ensureAuthenticated(req, {} as Response, (() => undefined) as NextFunction);

    return {
      unidadeAtiva: req.user.unidadeId,
      alcance: obterContextoRequisicao().unidadesDoUsuario,
    };
  });
}

describe("unidade ativa do DONO na autenticação", () => {
  it("começa em 'todas as unidades' mesmo com filial gravada", async () => {
    const dono = await criarUsuario("DONO", filialId);

    const { unidadeAtiva, alcance } = await autenticar(dono.id);

    expect(unidadeAtiva).toBeNull();
    expect(alcance?.sort()).toEqual([matrizId, filialId].sort());
  });

  it("o seletor ainda prende numa filial", async () => {
    const dono = await criarUsuario("DONO", null);

    expect((await autenticar(dono.id, filialId)).unidadeAtiva).toBe(filialId);
  });

  // O alcance sai da unidade GRAVADA, antes de ela ser zerada. Um DONO antigo
  // pode não ter vínculo nenhum; se o alcance dependesse do vínculo, ele
  // passaria a não enxergar nada.
  it("DONO antigo sem vínculo continua alcançando a conta", async () => {
    const dono = await criarUsuario("DONO", matrizId, false);

    const { unidadeAtiva, alcance } = await autenticar(dono.id);

    expect(unidadeAtiva).toBeNull();
    expect(alcance?.sort()).toEqual([matrizId, filialId].sort());
  });

  it("não mexe na unidade ativa dos outros perfis", async () => {
    const admin = await criarUsuario("ADMIN", filialId);

    expect((await autenticar(admin.id)).unidadeAtiva).toBe(filialId);
  });
});
