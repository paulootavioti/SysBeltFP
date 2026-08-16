import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { montarWhereMensalidade, type FiltrosFinanceiro } from "../utils/filtros";

// Contas a receber = mensalidades ainda em aberto (não pagas, não
// canceladas, não estornadas), independente de já estarem vencidas ou não.
export class GetContasAReceberService {
  async execute(unidadeId: number | null, filtros: FiltrosFinanceiro = {}) {
    const prisma = prismaDaRequisicao();
    return prisma.mensalidade.findMany({
      where: {
        ...montarWhereMensalidade(unidadeId, filtros),
        pago: false,
        status: { notIn: ["CANCELADA", "ESTORNADA"] },
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { vencimento: "asc" },
      include: { aluno: true, formaPagamento: true },
    });
  }
}
