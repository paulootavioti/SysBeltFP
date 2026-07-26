import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleTurmaAtivoService {
  async execute(id: number, unidadeId: number | null) {
    const turma = await prisma.turma.findUnique({ where: { id } });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    return prisma.turma.update({
      where: { id },
      data: { ativo: !turma.ativo },
    });
  }
}