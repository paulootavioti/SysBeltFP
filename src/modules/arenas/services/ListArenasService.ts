import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListArenasService {
  async execute(unidadeId: number | null) {
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
