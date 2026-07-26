import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class VincularAlunoTurmaService {

  async execute(
    turmaId: number,
    alunoId: number,
    unidadeId: number | null
  ) {

    const turma =
      await prisma.turma.findUnique({
        where: {
          id: turmaId
        }
      });

    if (!turma) {
      throw new AppError(
        "Turma não encontrada."
      );
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    if (!turma.ativo) {
      throw new AppError(
        "Não é possível matricular o aluno em uma turma inativa."
      );
    }

    const aluno =
      await prisma.aluno.findUnique({
        where: {
          id: alunoId
        }
      });

    if (!aluno || aluno.unidadeId !== turma.unidadeId) {
      throw new AppError(
        "Aluno não encontrado."
      );
    }

    return prisma.aluno.update({
      where: {
        id: alunoId
      },
      data: {
        turmaId
      }
    });

  }

}