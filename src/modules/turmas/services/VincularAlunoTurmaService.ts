import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export class VincularAlunoTurmaService {

  async execute(
    turmaId: number,
    alunoId: number
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

    if (!aluno) {
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