import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListPlanosService {
  async execute() {
    return prisma.plano.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: {
        nome: "asc",
      },
    });
  }
}
