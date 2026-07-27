import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoSalaService {
  async execute(id: number, unidadeId: number | null) {
    const sala = await prisma.sala.findUnique({ where: { id } });

    if (!sala) {
      throw new AppError("Sala não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, sala.unidadeId, "Sala não encontrada.");

    return prisma.sala.update({
      where: { id },
      data: { ativo: !sala.ativo },
    });
  }
}
