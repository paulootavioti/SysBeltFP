import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListFormasPagamentoService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.formaPagamento.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { tipo: "asc" },
    });
  }
}
