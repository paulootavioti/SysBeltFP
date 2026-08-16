import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListTurmasService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
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
        arena: true,
        modalidade: true,
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
