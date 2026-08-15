import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import type { StatusEvento, TipoEvento } from "../constants";

export interface FiltrosEvento {
  busca?: string;
  tipo?: TipoEvento;
  status?: StatusEvento;
  dataInicial?: string;
  dataFinal?: string;
}

export class ListEventosService {
  async execute(unidadeId: number | null, filtros: FiltrosEvento = {}) {
    const prisma = prismaDaRequisicao();
    return prisma.evento.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtros.busca ? { titulo: { contains: filtros.busca, mode: "insensitive" } } : {}),
        ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros.status ? { status: filtros.status } : {}),
        ...(filtros.dataInicial || filtros.dataFinal
          ? {
              dataInicio: {
                ...(filtros.dataInicial ? { gte: new Date(filtros.dataInicial) } : {}),
                ...(filtros.dataFinal ? { lte: new Date(filtros.dataFinal) } : {}),
              },
            }
          : {}),
      },
      orderBy: { dataInicio: "desc" },
    });
  }
}
