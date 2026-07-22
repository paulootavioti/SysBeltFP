import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListAulasProgramadasService {
  async execute() {
    return prisma.aulaProgramada.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        turma: true,
        aulaCurriculo: true,
      },
      orderBy: {
        data: "asc",
      },
    });
  }
}