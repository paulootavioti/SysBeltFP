import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListAlunosService {

  async execute(unidadeId: number | null) {

    const alunos =
      await prisma.aluno.findMany({
        where: escopoUnidade(unidadeId),
        take: LIMITE_PADRAO_LISTAGEM,
        orderBy: {
          nome: "asc"
        },
        include: {
          mensalidades: {
            orderBy: {
              vencimento: "desc"
            }
          }
        }
      });

    return alunos;
  }
}