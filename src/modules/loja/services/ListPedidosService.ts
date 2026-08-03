import { StatusPedido } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListPedidosFiltros {
  status?: StatusPedido;
  busca?: string;
}

export class ListPedidosService {
  async execute(unidadeId: number | null, filtros: ListPedidosFiltros = {}) {
    return prisma.pedido.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtros.status ? { status: filtros.status } : {}),
        ...(filtros.busca ? { aluno: { nome: { contains: filtros.busca, mode: "insensitive" } } } : {}),
      },
      include: {
        aluno: { select: { id: true, nome: true, apelido: true } },
        itens: { include: { variante: { include: { produto: true } } } },
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { criadoEm: "desc" },
    });
  }
}
