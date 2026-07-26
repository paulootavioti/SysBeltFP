import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetResponsavelService {
  async execute(id: number, unidadeId: number | null) {
    const responsavel = await prisma.responsavel.findUnique({
      where: { id },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            faixa: true,
          },
        },
      },
    });

    if (!responsavel) {
      throw new AppError("Responsável não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, responsavel.unidadeId, "Responsável não encontrado.");

    return responsavel;
  }
}