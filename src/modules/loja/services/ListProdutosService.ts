import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { CategoriaProduto } from "@prisma/client";

interface ListProdutosFiltros {
  busca?: string;
  categoria?: CategoriaProduto;
  ativo?: boolean;
}

export class ListProdutosService {
  async execute(unidadeId: number | null, filtros: ListProdutosFiltros = {}) {
    const produtos = await prisma.produto.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtros.busca ? { nome: { contains: filtros.busca, mode: "insensitive" } } : {}),
        ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
        ...(filtros.ativo !== undefined ? { ativo: filtros.ativo } : {}),
      },
      include: { variantes: true, unidade: { select: { id: true, nome: true } } },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { nome: "asc" },
    });

    return produtos.map((produto) => {
      const estoqueTotal = produto.variantes.reduce((soma, v) => soma + v.estoque, 0);

      return {
        ...produto,
        estoqueTotal,
        numVariantes: produto.variantes.length,
        estoqueBaixo: estoqueTotal === 0 || produto.variantes.some((v) => v.estoque <= 3),
      };
    });
  }
}
