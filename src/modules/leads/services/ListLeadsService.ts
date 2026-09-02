import { EstagioLead } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListLeadsFiltros {
  estagio?: EstagioLead;
  pagina?: number;
  limite?: number;
}

export class ListLeadsService {
  async execute(unidadeId: number | null, filtros: ListLeadsFiltros = {}) {
    const prisma = prismaDaRequisicao();
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 25;
    const where = { ...escopoUnidade(unidadeId), ...(filtros.estagio ? { estagio: filtros.estagio } : {}) };
    const [itens, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        include: {
          canal: { select: { id: true, nome: true } },
          modalidadeInteresse: { select: { id: true, nome: true } },
          responsavelUsuario: { select: { id: true, nome: true } },
        },
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { criadoEm: "desc" },
      }),
      prisma.lead.count({ where }),
    ]);
    return { itens, pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
  }
}
