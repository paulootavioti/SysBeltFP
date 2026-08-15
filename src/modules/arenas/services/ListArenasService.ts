import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListArenasService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.arena.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        unidade: {
          select: { id: true, nome: true },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}
