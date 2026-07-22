import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListResponsaveisService {
  async execute() {
    return prisma.responsavel.findMany({
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