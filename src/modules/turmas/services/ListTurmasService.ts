import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListTurmasService {
  async execute(unidadeId: number | null) {
    return prisma.turma.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        curriculo: true,
        professor: {
          select: {
            id: true,
            nome: true,
            apelido: true,
          },
        },
        sala: true,
        _count: {
          select: {
            alunos: {
              where: { ativo: true },
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