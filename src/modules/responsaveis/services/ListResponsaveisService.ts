import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListResponsaveisService {
  async execute(unidadeId: number | null) {
    return prisma.responsavel.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            faixa: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}