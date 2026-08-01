import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface RejeitarGraduacaoDTO {
  id: number;
  revisorId: number;
  unidadeIdRevisor: number | null;
  motivoRejeicao?: string;
}

export class RejeitarGraduacaoService {
  async execute({ id, revisorId, unidadeIdRevisor, motivoRejeicao }: RejeitarGraduacaoDTO) {
    const graduacao = await prisma.graduacao.findUnique({
      where: { id },
    });

    if (!graduacao) {
      throw new AppError("Solicitação de graduação não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeIdRevisor, graduacao.unidadeId, "Solicitação de graduação não encontrada.");

    if (graduacao.status !== "pendente") {
      throw new AppError("Só é possível rejeitar uma solicitação pendente.");
    }

    return prisma.graduacao.update({
      where: { id },
      data: {
        status: "rejeitada",
        revisadoPorId: revisorId,
        revisadoEm: new Date(),
        motivoRejeicao,
      },
    });
  }
}
