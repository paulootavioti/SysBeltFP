import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListComportamentosService {
  async execute() {
    return prisma.comportamento.findMany({
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