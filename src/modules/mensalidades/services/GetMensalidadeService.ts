import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetMensalidadeService {

  async execute(id: number, unidadeId: number | null) {

    const mensalidade =
      await prisma.mensalidade.findUnique({
        where: { id },
        include: {
          aluno: true
        }
      });

    if (!mensalidade) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidade.unidadeId, "Mensalidade não encontrada.");

    return mensalidade;
  }

}
