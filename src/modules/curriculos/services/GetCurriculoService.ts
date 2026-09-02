import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { calcularDuracaoTurmaMinutos, compilarFilaAula } from "../utils/compilarFilaAula";

export class GetCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const curriculo = await prisma.curriculo.findUnique({
      where: {
        id,
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
    });

    if (!curriculo) {
      throw new AppError("Currículo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, curriculo.unidadeId, "Currículo não encontrado.");

    return {
      ...curriculo,
      modulos: curriculo.modulos.map((modulo) => ({
        ...modulo,
        aulas: modulo.aulas.map((aula) => ({
          ...aula,
          filaCompilada: compilarFilaAula(aula),
          duracaoTurmaMinutos: curriculo.turmas.length ? Math.min(...curriculo.turmas.map((turma) => calcularDuracaoTurmaMinutos(turma.horarioInicio, turma.horarioFim))) : null,
        })),
      })),
    };
  }
}
