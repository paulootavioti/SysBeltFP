import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { aulaIncludeCompleto } from "./aulaInclude";

interface UpdateAulaDTO {
  jogosRealizados?: string[];
  tecnicasRealizadasIds?: number[];
}

export class UpdateAulaService {
  async execute(id: number, data: UpdateAulaDTO) {
    const aula = await prisma.aula.findUnique({ where: { id } });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    return prisma.aula.update({
      where: { id },
      data: {
        ...(data.jogosRealizados !== undefined && {
          jogosRealizados: data.jogosRealizados,
        }),
        ...(data.tecnicasRealizadasIds !== undefined && {
          tecnicasRealizadas: {
            set: data.tecnicasRealizadasIds.map((tecnicaId) => ({ id: tecnicaId })),
          },
        }),
      },
      include: aulaIncludeCompleto,
    });
  }
}
