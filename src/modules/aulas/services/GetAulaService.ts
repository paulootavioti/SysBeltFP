import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { aulaIncludeCompleto } from "./aulaInclude";

export class GetAulaService {
  async execute(id: number) {
    const aula = await prisma.aula.findUnique({
      where: {
        id,
      },
      include: aulaIncludeCompleto,
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    return aula;
  }
}
