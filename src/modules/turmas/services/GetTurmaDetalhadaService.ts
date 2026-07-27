import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetTurmaDetalhadaService {
  async execute(id: number, unidadeId: number | null) {
    const turma = await prisma.turma.findUnique({
      where: {
        id,
      },
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
        alunos: {
          orderBy: {
            nome: "asc",
          },
        },
      },
    });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    return turma;
  }
}