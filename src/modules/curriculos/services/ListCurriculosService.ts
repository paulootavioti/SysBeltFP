import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { calcularDuracaoTurmaMinutos, compilarFilaAula } from "../utils/compilarFilaAula";

export class ListCurriculosService {
  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const curriculos = await prisma.curriculo.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      where: {
        ativo: true,
        ...escopoUnidade(unidadeId),
      },
      include: {
        turmas: { where: { ativo: true }, select: { horarioInicio: true, horarioFim: true } },
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
                blocos: { orderBy: { ordem: "asc" } },
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
    return curriculos.map((curriculo) => ({
      ...curriculo,
      modulos: curriculo.modulos.map((modulo) => ({
        ...modulo,
        aulas: modulo.aulas.map((aula) => ({
          ...aula,
          filaCompilada: compilarFilaAula(aula),
          duracaoTurmaMinutos: curriculo.turmas.length ? Math.min(...curriculo.turmas.map((turma) => calcularDuracaoTurmaMinutos(turma.horarioInicio, turma.horarioFim))) : null,
        })),
      })),
    }));
  }
}
