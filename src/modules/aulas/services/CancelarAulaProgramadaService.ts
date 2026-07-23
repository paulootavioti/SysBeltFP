import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export class CancelarAulaProgramadaService {
  async execute(id: number) {
    const programacao = await prisma.aulaProgramada.findUnique({
      where: { id },
      include: { turma: true },
    });

    if (!programacao) {
      throw new AppError("Programação não encontrada.", 404);
    }

    if (programacao.status !== "PENDENTE") {
      throw new AppError("Só é possível cancelar uma programação pendente.");
    }

    return prisma.aulaProgramada.update({
      where: { id },
      data: { status: "CANCELADA" },
      include: { turma: true },
    });
  }
}
