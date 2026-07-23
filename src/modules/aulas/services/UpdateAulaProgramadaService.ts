import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface UpdateAulaProgramadaDTO {
  data?: string | null;
  aulaCurriculoId?: number | null;
  observacoes?: string | null;
}

export class UpdateAulaProgramadaService {
  async execute(id: number, dto: UpdateAulaProgramadaDTO) {
    const programacao = await prisma.aulaProgramada.findUnique({ where: { id } });

    if (!programacao) {
      throw new AppError("Programação não encontrada.", 404);
    }

    if (programacao.status !== "PENDENTE") {
      throw new AppError("Só é possível editar uma programação pendente.");
    }

    return prisma.aulaProgramada.update({
      where: { id },
      data: {
        data: dto.data ? new Date(dto.data) : undefined,
        aulaCurriculoId: dto.aulaCurriculoId,
        observacoes: dto.observacoes,
      },
      include: { turma: true, aulaCurriculo: true },
    });
  }
}
