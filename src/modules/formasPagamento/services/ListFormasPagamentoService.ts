import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListFormasPagamentoService {
  async execute(unidadeId: number | null) {
    return prisma.formaPagamento.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { tipo: "asc" },
    });
  }
}
