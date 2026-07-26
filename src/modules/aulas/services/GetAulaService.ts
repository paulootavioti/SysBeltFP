import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { aulaIncludeCompleto } from "./aulaInclude";

export class GetAulaService {
  async execute(id: number, unidadeId: number | null) {
    const aula = await prisma.aula.findUnique({
      where: {
        id,
      },
      include: aulaIncludeCompleto,
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, aula.unidadeId, "Aula não encontrada.");

    return aula;
  }
}
