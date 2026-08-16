import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { aulaIncludeCompleto } from "./aulaInclude";

interface UpdateAulaDTO {
  jogosRealizados?: string[];
  tecnicasRealizadasIds?: number[];
}

export class UpdateAulaService {
  async execute(id: number, data: UpdateAulaDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({ where: { id } });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, aula.unidadeId, "Aula não encontrada.");

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
