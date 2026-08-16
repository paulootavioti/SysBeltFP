import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListAssinaturasService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.assinatura.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { createdAt: "desc" },
      include: {
        aluno: { select: { id: true, nome: true } },
        plano: { select: { id: true, nome: true } },
        formaPagamento: true,
      },
    });
  }
}
