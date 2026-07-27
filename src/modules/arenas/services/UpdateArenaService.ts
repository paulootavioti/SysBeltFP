import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateArenaDTO {
  nome: string;
}

export class UpdateArenaService {
  async execute(id: number, data: UpdateArenaDTO, unidadeId: number | null) {
    const arena = await prisma.arena.findUnique({ where: { id } });

    if (!arena) {
      throw new AppError("Arena não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, arena.unidadeId, "Arena não encontrada.");

    return prisma.arena.update({
      where: { id },
      data,
    });
  }
}
