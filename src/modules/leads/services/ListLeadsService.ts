import { StatusLead } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListLeadsFiltros {
  status?: StatusLead;
}

export class ListLeadsService {
  async execute(unidadeId: number | null, filtros: ListLeadsFiltros = {}) {
    return prisma.lead.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtros.status ? { status: filtros.status } : {}),
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { criadoEm: "desc" },
    });
  }
}
