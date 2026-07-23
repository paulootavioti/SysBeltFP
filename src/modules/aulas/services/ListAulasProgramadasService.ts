import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { calcularRangeContagem, type PeriodoContagem } from "../utils/periodoContagem";

interface ListAulasProgramadasFiltros {
  turmaId?: number;
  periodo?: PeriodoContagem;
}

export class ListAulasProgramadasService {
  async execute(filtros: ListAulasProgramadasFiltros = {}) {
    const range = filtros.periodo ? calcularRangeContagem(filtros.periodo) : undefined;

    return prisma.aulaProgramada.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        turmaId: filtros.turmaId,
        data: range ? { gte: range.inicio, lte: range.fim } : undefined,
      },
      include: {
        turma: true,
        aulaCurriculo: true,
      },
      orderBy: {
        data: "asc",
      },
    });
  }
}
