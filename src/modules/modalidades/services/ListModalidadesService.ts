import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListModalidadesFiltro {
  apenasAtivas?: boolean;
}

export class ListModalidadesService {
  async execute(unidadeId: number | null, filtro: ListModalidadesFiltro = {}) {
    return prisma.modalidade.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtro.apenasAtivas ? { ativo: true } : {}),
      },
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        unidade: { select: { id: true, nome: true } },
        coordenador: { select: { id: true, nome: true } },
        _count: { select: { turmas: true, curriculos: true } },
      },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
  }
}
