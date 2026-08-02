import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateProdutoService } from "./CreateProdutoService";
import { UpdateProdutoService } from "./UpdateProdutoService";
import { ToggleAtivoProdutoService } from "./ToggleAtivoProdutoService";
import { ListProdutosService } from "./ListProdutosService";
import { GetLojaKpisService } from "./GetLojaKpisService";

const createService = new CreateProdutoService();
const updateService = new UpdateProdutoService();
const toggleService = new ToggleAtivoProdutoService();
const listService = new ListProdutosService();
const kpisService = new GetLojaKpisService();

let unidadeAId: number;
let unidadeBId: number;

async function limpar() {
  await prisma.movimentacaoEstoque.deleteMany({
    where: { variante: { produto: { unidade: { nome: { startsWith: "TESTE_LOJACRUD_" } } } } },
  });
  await prisma.produtoVariante.deleteMany({
    where: { produto: { unidade: { nome: { startsWith: "TESTE_LOJACRUD_" } } } },
  });
  await prisma.produto.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_LOJACRUD_" } } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_LOJACRUD_" } } });
}

beforeEach(async () => {
  await limpar();
  const unidadeA = await prisma.unidade.create({ data: { nome: "TESTE_LOJACRUD_UNIDADE_A" } });
  const unidadeB = await prisma.unidade.create({ data: { nome: "TESTE_LOJACRUD_UNIDADE_B" } });
  unidadeAId = unidadeA.id;
  unidadeBId = unidadeB.id;
});
afterAll(limpar);

describe("CreateProdutoService", () => {
  it("cria o produto com as variantes vinculadas", async () => {
    const produto = await createService.execute({
      unidadeId: unidadeAId,
      nome: "Kimono Trançado A0",
      categoria: "KIMONO",
      preco: 450,
      variantes: [
        { tamanho: "A0", estoque: 5 },
        { tamanho: "A1", cor: "Azul", estoque: 2 },
      ],
    });

    expect(produto.variantes).toHaveLength(2);
    expect(produto.unidadeId).toBe(unidadeAId);
    expect(produto.ativo).toBe(true);
  });
});

describe("ListProdutosService — filtros e estoque baixo", () => {
  it("só lista produtos da própria unidade e calcula estoqueTotal/estoqueBaixo", async () => {
    await createService.execute({
      unidadeId: unidadeAId,
      nome: "Rashguard Manga Longa",
      categoria: "RASHGUARD",
      preco: 150,
      variantes: [
        { tamanho: "M", estoque: 2 },
        { tamanho: "G", estoque: 20 },
      ],
    });
    await createService.execute({
      unidadeId: unidadeAId,
      nome: "Chaveiro Faixa Preta",
      categoria: "CHAVEIRO",
      preco: 20,
      variantes: [{ tamanho: "Único", estoque: 0 }],
    });
    await createService.execute({
      unidadeId: unidadeBId,
      nome: "Bermuda Fight Shorts",
      categoria: "BERMUDA",
      preco: 120,
      variantes: [{ tamanho: "G", estoque: 10 }],
    });

    const listaA = await listService.execute(unidadeAId);
    expect(listaA).toHaveLength(2);

    const rashguard = listaA.find((p) => p.nome === "Rashguard Manga Longa")!;
    expect(rashguard.estoqueTotal).toBe(22);
    expect(rashguard.numVariantes).toBe(2);
    expect(rashguard.estoqueBaixo).toBe(true); // uma variante com 2 unidades (≤3)

    const chaveiro = listaA.find((p) => p.nome === "Chaveiro Faixa Preta")!;
    expect(chaveiro.estoqueTotal).toBe(0);
    expect(chaveiro.estoqueBaixo).toBe(true); // total zerado

    const busca = await listService.execute(unidadeAId, { busca: "rashguard" });
    expect(busca).toHaveLength(1);

    const porCategoria = await listService.execute(unidadeAId, { categoria: "CHAVEIRO" });
    expect(porCategoria).toHaveLength(1);
  });
});

describe("UpdateProdutoService — adicionar/remover variante e isolamento", () => {
  it("adiciona e remove variantes ao atualizar", async () => {
    const produto = await createService.execute({
      unidadeId: unidadeAId,
      nome: "Faixa Adulto",
      categoria: "FAIXA",
      preco: 80,
      variantes: [
        { tamanho: "A2", estoque: 4 },
        { tamanho: "A3", estoque: 1 },
      ],
    });

    const varianteMantida = produto.variantes.find((v) => v.tamanho === "A2")!;

    const atualizado = await updateService.execute(
      produto.id,
      {
        nome: "Faixa Adulto",
        categoria: "FAIXA",
        preco: 85,
        variantes: [
          { id: varianteMantida.id, tamanho: "A2", estoque: 10 },
          { tamanho: "A4", estoque: 3 },
        ],
      },
      unidadeAId
    );

    expect(atualizado.preco).toBe(85);
    expect(atualizado.variantes).toHaveLength(2);
    expect(atualizado.variantes.find((v) => v.tamanho === "A2")?.estoque).toBe(10);
    expect(atualizado.variantes.some((v) => v.tamanho === "A3")).toBe(false);
    expect(atualizado.variantes.some((v) => v.tamanho === "A4")).toBe(true);
  });

  it("rejeita atualizar um produto de outra unidade", async () => {
    const produto = await createService.execute({
      unidadeId: unidadeAId,
      nome: "Patch Bordado",
      categoria: "PATCH",
      preco: 30,
      variantes: [{ tamanho: "Único", estoque: 5 }],
    });

    await expect(
      updateService.execute(
        produto.id,
        { nome: "Patch Bordado", categoria: "PATCH", preco: 30, variantes: [{ tamanho: "Único", estoque: 5 }] },
        unidadeBId
      )
    ).rejects.toThrow(AppError);
  });
});

describe("ToggleAtivoProdutoService", () => {
  it("alterna ativo/inativo e rejeita entre unidades diferentes", async () => {
    const produto = await createService.execute({
      unidadeId: unidadeAId,
      nome: "Pulseira Faixa",
      categoria: "PULSEIRA",
      preco: 15,
      variantes: [{ tamanho: "Único", estoque: 8 }],
    });

    const inativado = await toggleService.execute(produto.id, unidadeAId);
    expect(inativado.ativo).toBe(false);

    await expect(toggleService.execute(produto.id, unidadeBId)).rejects.toThrow(AppError);
  });
});

describe("GetLojaKpisService", () => {
  it("calcula os KPIs a partir dos produtos ativos", async () => {
    await createService.execute({
      unidadeId: unidadeAId,
      nome: "Kimono Trançado A1",
      categoria: "KIMONO",
      preco: 100,
      variantes: [
        { tamanho: "A1", estoque: 2 },
        { tamanho: "A2", estoque: 10 },
      ],
    });
    const inativo = await createService.execute({
      unidadeId: unidadeAId,
      nome: "Produto Descontinuado",
      categoria: "OUTROS",
      preco: 999,
      variantes: [{ tamanho: "Único", estoque: 50 }],
    });
    await toggleService.execute(inativo.id, unidadeAId);

    const kpis = await kpisService.execute(unidadeAId);

    expect(kpis.produtosAtivos).toBe(1);
    expect(kpis.unidadesEmEstoque).toBe(12);
    expect(kpis.produtosComEstoqueBaixo).toBe(1);
    expect(kpis.valorTotalEstoque).toBe(1200);
  });
});
