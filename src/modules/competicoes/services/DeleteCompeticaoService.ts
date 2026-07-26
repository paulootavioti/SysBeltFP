import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteCompeticaoService {
  async execute(id: number, unidadeId: number | null) {
    const competicao = await prisma.competicao.findUnique({ where: { id } });

    if (!competicao) {
      throw new AppError("Competição não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, competicao.unidadeId, "Competição não encontrada.");

    await prisma.$transaction([
      prisma.competicaoAluno.deleteMany({ where: { competicaoId: id } }),
      prisma.competicao.delete({ where: { id } }),
    ]);
  }
}
