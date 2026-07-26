import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface CreateAulaProgramadaDTO {
  turmaId: number;
  aulaCurriculoId?: number;
  data: string;
  observacoes?: string;
}

export class CreateAulaProgramadaService {
  async execute(data: CreateAulaProgramadaDTO) {
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    if (data.aulaCurriculoId) {
      const aulaCurriculo = await prisma.aulaCurriculo.findUnique({
        where: { id: data.aulaCurriculoId },
      });

      if (!aulaCurriculo) {
        throw new AppError("Aula do currículo não encontrada.");
      }
    }

    return prisma.aulaProgramada.create({
      data: {
        unidadeId: turma.unidadeId,
        turmaId: data.turmaId,
        aulaCurriculoId: data.aulaCurriculoId,
        data: new Date(data.data),
        observacoes: data.observacoes,
      },
      include: {
        turma: true,
        aulaCurriculo: true,
      },
    });
  }
}