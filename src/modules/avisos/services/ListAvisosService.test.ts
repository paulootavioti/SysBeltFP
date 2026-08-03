import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { ListAvisosService } from "./ListAvisosService";
import { ReconhecerAvisosService } from "./ReconhecerAvisosService";

const listService = new ListAvisosService();
const reconhecerService = new ReconhecerAvisosService();

let unidadeId: number;

async function criarUsuario(email: string) {
  return prisma.usuario.create({
    data: { unidadeId, nome: "TESTE_GESTOR", email, senha: "hash", perfil: "ADMIN" },
  });
}

async function criarAlunoComMensalidadeVencida(diasAtras: number) {
  const aluno = await prisma.aluno.create({
    data: { unidadeId, nome: "TESTE_AVISO_ALUNO", dataNascimento: new Date("2000-01-01") },
  });

  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() - diasAtras);

  const mensalidade = await prisma.mensalidade.create({
    data: { unidadeId, alunoId: aluno.id, valor: 150, vencimento, pago: false },
  });

  return { aluno, mensalidade };
}

async function criarPedidoAguardandoRetirada() {
  const aluno = await prisma.aluno.create({
    data: { unidadeId, nome: "TESTE_AVISO_ALUNO", dataNascimento: new Date("2000-01-01") },
  });

  const produto = await prisma.produto.create({
    data: {
      unidadeId,
      nome: "TESTE_AVISO_PRODUTO",
      categoria: "KIMONO",
      preco: 100,
      variantes: { create: [{ tamanho: "Único", estoque: 5 }] },
    },
    include: { variantes: true },
  });

  const pedido = await prisma.pedido.create({
    data: {
      unidadeId,
      alunoId: aluno.id,
      total: 100,
      itens: { create: [{ varianteId: produto.variantes[0].id, quantidade: 1, precoUnitario: 100 }] },
    },
  });

  return { aluno, pedido };
}

async function limpar() {
  await prisma.avisoReconhecido.deleteMany({ where: { usuario: { nome: "TESTE_GESTOR" } } });
  await prisma.usuario.deleteMany({ where: { nome: "TESTE_GESTOR" } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: "TESTE_AVISO_ALUNO" } } });
  await prisma.itemPedido.deleteMany({ where: { pedido: { aluno: { nome: "TESTE_AVISO_ALUNO" } } } });
  await prisma.pedido.deleteMany({ where: { aluno: { nome: "TESTE_AVISO_ALUNO" } } });
  await prisma.produtoVariante.deleteMany({ where: { produto: { nome: "TESTE_AVISO_PRODUTO" } } });
  await prisma.produto.deleteMany({ where: { nome: "TESTE_AVISO_PRODUTO" } });
  await prisma.aluno.deleteMany({ where: { nome: "TESTE_AVISO_ALUNO" } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_AVISOS_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_AVISOS_UNIDADE" } });
  unidadeId = unidade.id;
});
afterAll(limpar);

describe("ListAvisosService + ReconhecerAvisosService", () => {
  it("lista mensalidade vencida como aviso não reconhecido", async () => {
    const usuario = await criarUsuario("gestor-avisos-1@teste.com");
    const { mensalidade } = await criarAlunoComMensalidadeVencida(5);

    const avisos = await listService.execute(usuario.id, unidadeId);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: "MENSALIDADE_VENCIDA",
      referenciaId: mensalidade.id,
    });
  });

  it("não lista mensalidade em dia (vencimento futuro)", async () => {
    const usuario = await criarUsuario("gestor-avisos-2@teste.com");
    const aluno = await prisma.aluno.create({
      data: { unidadeId, nome: "TESTE_AVISO_ALUNO", dataNascimento: new Date("2000-01-01") },
    });
    const vencimentoFuturo = new Date();
    vencimentoFuturo.setDate(vencimentoFuturo.getDate() + 10);
    await prisma.mensalidade.create({
      data: { unidadeId, alunoId: aluno.id, valor: 150, vencimento: vencimentoFuturo, pago: false },
    });

    const avisos = await listService.execute(usuario.id, unidadeId);
    expect(avisos).toHaveLength(0);
  });

  it("some da lista depois de reconhecido, mas continua existindo pra outro usuário", async () => {
    const gestor1 = await criarUsuario("gestor-avisos-3@teste.com");
    const gestor2 = await criarUsuario("gestor-avisos-4@teste.com");
    const { mensalidade } = await criarAlunoComMensalidadeVencida(3);

    await reconhecerService.execute(gestor1.id, [
      { tipo: "MENSALIDADE_VENCIDA", referenciaId: mensalidade.id },
    ]);

    const avisosGestor1 = await listService.execute(gestor1.id, unidadeId);
    const avisosGestor2 = await listService.execute(gestor2.id, unidadeId);

    expect(avisosGestor1).toHaveLength(0);
    expect(avisosGestor2).toHaveLength(1);
  });

  it("reconhecer o mesmo aviso duas vezes não gera erro (idempotente)", async () => {
    const usuario = await criarUsuario("gestor-avisos-5@teste.com");
    const { mensalidade } = await criarAlunoComMensalidadeVencida(2);

    const aviso = { tipo: "MENSALIDADE_VENCIDA", referenciaId: mensalidade.id };

    await reconhecerService.execute(usuario.id, [aviso]);
    await expect(reconhecerService.execute(usuario.id, [aviso])).resolves.not.toThrow();

    const avisos = await listService.execute(usuario.id, unidadeId);
    expect(avisos).toHaveLength(0);
  });

  it("lista pedido aguardando retirada como aviso não reconhecido", async () => {
    const usuario = await criarUsuario("gestor-avisos-6@teste.com");
    const { pedido } = await criarPedidoAguardandoRetirada();

    const avisos = await listService.execute(usuario.id, unidadeId);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: "PEDIDO_AGUARDANDO_RETIRADA",
      referenciaId: pedido.id,
    });
  });

  it("some da lista de pedidos depois de reconhecido", async () => {
    const usuario = await criarUsuario("gestor-avisos-7@teste.com");
    const { pedido } = await criarPedidoAguardandoRetirada();

    await reconhecerService.execute(usuario.id, [
      { tipo: "PEDIDO_AGUARDANDO_RETIRADA", referenciaId: pedido.id },
    ]);

    const avisos = await listService.execute(usuario.id, unidadeId);
    expect(avisos).toHaveLength(0);
  });
});
