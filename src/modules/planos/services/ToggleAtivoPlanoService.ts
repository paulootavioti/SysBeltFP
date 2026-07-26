import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoPlanoService {
  async execute(id: number, unidadeId: number | null) {
    const plano = await prisma.plano.findUnique({ where: { id } });

    if (!plano) {
      throw new AppError("Plano não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, plano.unidadeId, "Plano não encontrado.");

    return prisma.plano.update({
      where: { id },
      data: { ativo: !plano.ativo },
    });
  }
}
