import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListComportamentosService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.comportamento.findMany({
      where: { aluno: escopoUnidade(unidadeId) },
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        aluno: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
}
