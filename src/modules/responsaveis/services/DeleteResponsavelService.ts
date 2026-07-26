import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteResponsavelService {
  async execute(id: number, unidadeId: number | null) {
    const responsavel = await prisma.responsavel.findUnique({
      where: { id },
    });

    if (!responsavel) {
      throw new AppError("Responsável não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, responsavel.unidadeId, "Responsável não encontrado.");

    await prisma.responsavel.delete({
      where: { id },
    });

    return {
      message: "Responsável excluído com sucesso.",
    };
  }
}