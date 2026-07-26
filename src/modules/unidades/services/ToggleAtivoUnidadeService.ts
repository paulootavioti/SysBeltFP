import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export class ToggleAtivoUnidadeService {
  async execute(id: number) {
    const unidade = await prisma.unidade.findUnique({ where: { id } });

    if (!unidade) {
      throw new AppError("Unidade não encontrada.");
    }

    return prisma.unidade.update({
      where: { id },
      data: { ativo: !unidade.ativo },
    });
  }
}
