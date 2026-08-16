import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { calcularRangeContagem, type PeriodoContagem } from "../utils/periodoContagem";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListAulasProgramadasFiltros {
  turmaId?: number;
  periodo?: PeriodoContagem;
}

export class ListAulasProgramadasService {
  async execute(filtros: ListAulasProgramadasFiltros = {}, unidadeId: number | null = null) {
    const prisma = prismaDaRequisicao();
    const range = filtros.periodo ? calcularRangeContagem(filtros.periodo) : undefined;

    return prisma.aulaProgramada.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        turmaId: filtros.turmaId,
        data: range ? { gte: range.inicio, lte: range.fim } : undefined,
        ...escopoUnidade(unidadeId),
      },
      include: {
        turma: {
          include: {
            professor: {
              select: { id: true, nome: true, apelido: true },
            },
            arena: {
              select: { id: true, nome: true },
            },
          },
        },
        aulaCurriculo: true,
        professorSubstituto: {
          select: { id: true, nome: true, apelido: true },
        },
      },
      orderBy: {
        data: "asc",
      },
    });
  }
}
