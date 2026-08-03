import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CriarPedidoFamiliaService } from "../../portalFamilia/services/CriarPedidoFamiliaService";
import { GetLojaFamiliaService } from "../../portalFamilia/services/GetLojaFamiliaService";
import { ListPedidosService } from "./ListPedidosService";
import { MarcarPedidoEntregueService } from "./MarcarPedidoEntregueService";
import { CancelarPedidoService } from "./CancelarPedidoService";

const criarPedidoService = new CriarPedidoFamiliaService();
const getLojaFamiliaService = new GetLojaFamiliaService();
const listService = new ListPedidosService();
const entregarService = new MarcarPedidoEntregueService();
const cancelarService = new CancelarPedidoService();

let unidadeAId: number;
let unidadeBId: number;
let alunoAId: number;
let varianteId: number;
let varianteBId: number;

async function limpar() {
  await prisma.itemPedido.deleteMany({
    where: { pedido: { unidade: { nome: { startsWith: "TESTE_PEDIDO_" } } } },
  });
  await prisma.pedido.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PEDIDO_" } } } });
  await prisma.movimentacaoEstoque.deleteMany({
    where: { variante: { produto: { unidade: { nome: { startsWith: "TESTE_PEDIDO_" } } } } },
  });
  await prisma.produtoVariante.deleteMany({
    where: { produto: { unidade: { nome: { startsWith: "TESTE_PEDIDO_" } } } },
  });
  await prisma.produto.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_PEDIDO_" } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_PEDIDO_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_PEDIDO_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_PEDIDO_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_PEDIDO_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;

  const aluno = await prisma.aluno.create({
    data: { unidadeId: unidadeAId, nome: "TESTE_PEDIDO_ALUNO", dataNascimento: new Date("2010-01-01") },
  });
  alunoAId = aluno.id;

  const produto = await prisma.produto.create({
    data: {
      unidadeId: unidadeAId,
      nome: "TESTE_PEDIDO_KIMONO",
      categoria: "KIMONO",
      preco: 200,
      variantes: { create: [{ tamanho: "A2", estoque: 5 }] },
    },
    include: { variantes: true },
  });
  varianteId = produto.variantes[0].id;

  const produtoB = await prisma.produto.create({
    data: {
      unidadeId: unidadeBId,
      nome: "TESTE_PEDIDO_RASHGUARD",
      categoria: "RASHGUARD",
      preco: 150,
      variantes: { create: [{ tamanho: "M", estoque: 5 }] },
    },
    include: { variantes: true },
  });
  varianteBId = produtoB.variantes[0].id;
});
afterAll(limpar);

describe("CriarPedidoFamiliaService", () => {
  it("cria o pedido, decrementa o estoque e calcula o total", async () => {
    const pedido = await criarPedidoService.execute(alunoAId, [{ varianteId, quantidade: 2 }]);

    expect(pedido.total).toBe(400);
    expect(pedido.status).toBe("AGUARDANDO_RETIRADA");

    const variante = await prisma.produtoVariante.findUnique({ where: { id: varianteId } });
    expect(variante?.estoque).toBe(3);

    const movimentacao = await prisma.movimentacaoEstoque.findFirst({ where: { varianteId, tipo: "SAIDA" } });
    expect(movimentacao?.quantidade).toBe(2);
  });

  it("rejeita quando o estoque é insuficiente", async () => {
    await expect(criarPedidoService.execute(alunoAId, [{ varianteId, quantidade: 99 }])).rejects.toThrow(
      AppError
    );
  });

  it("rejeita carrinho vazio", async () => {
    await expect(criarPedidoService.execute(alunoAId, [])).rejects.toThrow(AppError);
  });

  it("permite comprar produto de outra unidade e registra o pedido na unidade do produto", async () => {
    const pedido = await criarPedidoService.execute(alunoAId, [{ varianteId: varianteBId, quantidade: 1 }]);

    expect(pedido.unidadeId).toBe(unidadeBId);

    const listaA = await listService.execute(unidadeAId);
    expect(listaA).toHaveLength(0);

    const listaB = await listService.execute(unidadeBId);
    expect(listaB).toHaveLength(1);
  });

  it("rejeita carrinho com produtos de unidades diferentes", async () => {
    await expect(
      criarPedidoService.execute(alunoAId, [
        { varianteId, quantidade: 1 },
        { varianteId: varianteBId, quantidade: 1 },
      ])
    ).rejects.toThrow(AppError);
  });
});

describe("GetLojaFamiliaService", () => {
  it("lista produtos ativos de todas as unidades, com a unidade de cada um", async () => {
    const produtos = await getLojaFamiliaService.execute();

    const nomes = produtos.map((p) => p.nome);
    expect(nomes).toContain("TESTE_PEDIDO_KIMONO");
    expect(nomes).toContain("TESTE_PEDIDO_RASHGUARD");

    const rashguard = produtos.find((p) => p.nome === "TESTE_PEDIDO_RASHGUARD");
    expect(rashguard?.unidade.id).toBe(unidadeBId);
  });
});

describe("ListPedidosService / MarcarPedidoEntregueService / CancelarPedidoService", () => {
  it("lista pedidos escopados por unidade e filtra por status", async () => {
    await criarPedidoService.execute(alunoAId, [{ varianteId, quantidade: 1 }]);

    const listaA = await listService.execute(unidadeAId);
    expect(listaA).toHaveLength(1);

    const listaB = await listService.execute(unidadeBId);
    expect(listaB).toHaveLength(0);

    const aguardando = await listService.execute(unidadeAId, { status: "AGUARDANDO_RETIRADA" });
    expect(aguardando).toHaveLength(1);

    const entregues = await listService.execute(unidadeAId, { status: "ENTREGUE" });
    expect(entregues).toHaveLength(0);
  });

  it("marca como entregue e rejeita unidade errada", async () => {
    const pedido = await criarPedidoService.execute(alunoAId, [{ varianteId, quantidade: 1 }]);

    await expect(entregarService.execute(pedido.id, unidadeBId)).rejects.toThrow(AppError);

    const entregue = await entregarService.execute(pedido.id, unidadeAId);
    expect(entregue.status).toBe("ENTREGUE");
    expect(entregue.entregueEm).not.toBeNull();

    await expect(entregarService.execute(pedido.id, unidadeAId)).rejects.toThrow(AppError);
  });

  it("cancela e restaura o estoque", async () => {
    const pedido = await criarPedidoService.execute(alunoAId, [{ varianteId, quantidade: 2 }]);

    const varianteAntes = await prisma.produtoVariante.findUnique({ where: { id: varianteId } });
    expect(varianteAntes?.estoque).toBe(3);

    const cancelado = await cancelarService.execute(pedido.id, unidadeAId);
    expect(cancelado.status).toBe("CANCELADO");

    const varianteDepois = await prisma.produtoVariante.findUnique({ where: { id: varianteId } });
    expect(varianteDepois?.estoque).toBe(5);

    const movimentacaoEntrada = await prisma.movimentacaoEstoque.findFirst({
      where: { varianteId, tipo: "ENTRADA" },
    });
    expect(movimentacaoEntrada?.quantidade).toBe(2);
  });
});
