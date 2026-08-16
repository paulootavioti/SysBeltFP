import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { montarWhereMensalidade, type FiltrosFinanceiro } from "../utils/filtros";

export class GetContasVencidasService {
  async execute(unidadeId: number | null, filtros: FiltrosFinanceiro = {}) {
    const prisma = prismaDaRequisicao();
    return prisma.mensalidade.findMany({
      where: {
        ...montarWhereMensalidade(unidadeId, filtros),
        pago: false,
        status: { notIn: ["CANCELADA", "ESTORNADA"] },
        vencimento: { lt: new Date() },
      },
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { vencimento: "asc" },
      include: { aluno: true, formaPagamento: true },
    });
  }
}
