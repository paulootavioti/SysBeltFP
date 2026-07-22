import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListTecnicasService {
  async execute() {
    return prisma.tecnica.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        ativa: true,
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}