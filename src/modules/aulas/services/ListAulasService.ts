import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { calcularRangeContagem, type PeriodoContagem } from "../utils/periodoContagem";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListAulasFiltros {
  turmaId?: number;
  periodo?: PeriodoContagem;
}

export class ListAulasService {
  async execute(filtros: ListAulasFiltros = {}, unidadeId: number | null = null) {
    const range = filtros.periodo ? calcularRangeContagem(filtros.periodo) : undefined;

    return prisma.aula.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        turmaId: filtros.turmaId,
        data: range ? { gte: range.inicio, lte: range.fim } : undefined,
        ...escopoUnidade(unidadeId),
      },
      include: {
        turma: true,
      },
      orderBy: {
        data: "desc",
      },
    });
  }
}
