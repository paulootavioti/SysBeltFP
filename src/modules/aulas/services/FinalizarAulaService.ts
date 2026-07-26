import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class FinalizarAulaService {
  async execute(id: number, unidadeId: number | null) {
    const aula = await prisma.aula.findUnique({
      where: { id },
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (aula.status === "FINALIZADA") {
      throw new AppError("Esta aula já foi finalizada.");
    }

    return prisma.aula.update({
      where: { id },
      data: {
        status: "FINALIZADA",
      },
    });
  }
}