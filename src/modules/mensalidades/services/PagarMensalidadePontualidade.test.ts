import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { PagarMensalidadeService } from "./PagarMensalidadeService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const pagarService = new PagarMensalidadeService();

let unidadeId: number;
let usuarioId: number;
let alunoId: number;
let assinaturaId: number;

async function limpar() {
  await prisma.auditLog.deleteMany({ where: { usuario: { email: "teste.vitest.pontualidade@sysbelt.local" } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_PONTUALIDADE_" } } } });
  await prisma.assinatura.deleteMany({ where: { aluno: { nome: { startsWith: "TESTE_PONTUALIDADE_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_PONTUALIDADE_" } } });
  await prisma.usuario.deleteMany({ where: { email: "teste.vitest.pontualidade@sysbelt.local" } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_PONTUALIDADE_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await criarUnidadeDeTeste("TESTE_PONTUALIDADE_UNIDADE");
  unidadeId = unidade.id;

  const usuario = await prisma.usuario.create({
    data: {
      unidadeId,
      nome: "TESTE_PONTUALIDADE_ADMIN",
      email: "teste.vitest.pontualidade@sysbelt.local",
      senha: "hash-fake",
      perfil: "ADMIN",
    },
  });
  usuarioId = usuario.id;

  const aluno = await prisma.aluno.create({
    data: { unidadeId, nome: "TESTE_PONTUALIDADE_ALUNO", dataNascimento: new Date("2000-01-01") },
  });
  alunoId = aluno.id;

  const assinatura = await prisma.assinatura.create({
    data: {
      unidadeId,
      alunoId,
      valor: 100,
      diaVencimento: 10,
      dataInicio: new Date("2026-01-01"),
      indeterminado: true,
      descontoPontualidade: 15,
    },
  });
  assinaturaId = assinatura.id;
});
afterAll(limpar);

describe("PagarMensalidadeService — desconto por pontualidade", () => {
  it("aplica o desconto por pontualidade quando o pagamento ocorre até o vencimento", async () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const mensalidade = await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId,
        assinaturaId,
        valor: 100,
        valorOriginal: 100,
        valorFinal: 100,
        vencimento: amanha,
      },
    });

    const paga = await pagarService.execute(mensalidade.id, unidadeId, usuarioId);

    expect(paga.desconto).toBe(15);
    expect(paga.valorFinal).toBe(85);
  });

  it("não aplica o desconto por pontualidade quando o pagamento ocorre após o vencimento", async () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    const mensalidade = await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId,
        assinaturaId,
        valor: 100,
        valorOriginal: 100,
        valorFinal: 100,
        vencimento: ontem,
      },
    });

    const paga = await pagarService.execute(mensalidade.id, unidadeId, usuarioId);

    expect(paga.desconto).toBe(0);
    expect(paga.valorFinal).toBe(100);
  });

  it("não aplica desconto por pontualidade em mensalidade avulsa (sem assinatura)", async () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const mensalidade = await prisma.mensalidade.create({
      data: {
        unidadeId,
        alunoId,
        valor: 100,
        valorOriginal: 100,
        valorFinal: 100,
        vencimento: amanha,
      },
    });

    const paga = await pagarService.execute(mensalidade.id, unidadeId, usuarioId);

    expect(paga.desconto).toBe(0);
    expect(paga.valorFinal).toBe(100);
  });
});
