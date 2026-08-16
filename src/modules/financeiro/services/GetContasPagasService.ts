import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { montarWhereMensalidade, type FiltrosFinanceiro } from "../utils/filtros";

export class GetContasPagasService {
  async execute(unidadeId: number | null, filtros: FiltrosFinanceiro = {}) {
    const prisma = prismaDaRequisicao();
    return prisma.mensalidade.findMany({
      where: {
        ...montarWhereMensalidade(unidadeId, filtros),
        status: "PAGA",
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { dataPagamento: "desc" },
      include: { aluno: true, formaPagamento: true },
    });
  }
}
