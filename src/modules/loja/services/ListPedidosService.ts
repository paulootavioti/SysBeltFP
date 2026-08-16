import { StatusPedido } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListPedidosFiltros {
  status?: StatusPedido;
  busca?: string;
}

export class ListPedidosService {
  async execute(unidadeId: number | null, filtros: ListPedidosFiltros = {}) {
    const prisma = prismaDaRequisicao();
    return prisma.pedido.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtros.status ? { status: filtros.status } : {}),
        ...(filtros.busca ? { aluno: { nome: { contains: filtros.busca, mode: "insensitive" } } } : {}),
      },
      include: {
        unidade: { select: { id: true, nome: true } },
        aluno: { select: { id: true, nome: true, apelido: true } },
        itens: { include: { variante: { include: { produto: true } } } },
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { criadoEm: "desc" },
    });
  }
}
