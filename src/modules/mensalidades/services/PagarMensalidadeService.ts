import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class PagarMensalidadeService {

  async execute(id: number, unidadeId: number | null) {

    const mensalidadeExistente = await prisma.mensalidade.findUnique({ where: { id } });

    if (!mensalidadeExistente) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidadeExistente.unidadeId, "Mensalidade não encontrada.");

    const mensalidade =
      await prisma.mensalidade.update({
        where: {
          id
        },
        data: {
          pago: true,
          dataPagamento: new Date()
        }
      });

    return mensalidade;
  }

}