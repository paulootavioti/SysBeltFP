import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListCurriculosService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    return prisma.curriculo.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        ativo: true,
        ...escopoUnidade(unidadeId),
      },
      include: {
        modalidade: { select: { id: true, nome: true } },
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
