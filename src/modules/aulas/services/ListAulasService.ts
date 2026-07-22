import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListAulasService {
  async execute() {
    return prisma.aula.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        turma: true,
      },
      orderBy: {
        data: "desc",
      },
    });
  }
}