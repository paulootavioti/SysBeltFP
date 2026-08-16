import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { montarWhereMensalidade, type FiltrosFinanceiro } from "../utils/filtros";

export class GetCobrancasCanceladasService {
  async execute(unidadeId: number | null, filtros: FiltrosFinanceiro = {}) {
    const prisma = prismaDaRequisicao();
    return prisma.mensalidade.findMany({
      where: {
        ...montarWhereMensalidade(unidadeId, filtros),
        status: "CANCELADA",
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { canceladoEm: "desc" },
      include: { aluno: true, formaPagamento: true },
    });
  }
}
