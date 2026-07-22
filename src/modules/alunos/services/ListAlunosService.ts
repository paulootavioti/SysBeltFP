import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListAlunosService {

  async execute() {

    const alunos =
      await prisma.aluno.findMany({
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