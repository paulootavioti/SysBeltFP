import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListCurriculosService {
  async execute() {
    return prisma.curriculo.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        ativo: true,
      },
      include: {
        modulos: {
          orderBy: {
            ordem: "asc",
          },
          include: {
            aulas: {
              orderBy: {
                ordem: "asc",
              },
              include: {
                tecnicas: {
                  orderBy: {
                    ordem: "asc",
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });
  }
}