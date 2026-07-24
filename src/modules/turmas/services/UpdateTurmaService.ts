import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface UpdateTurmaDTO {
  nome: string;
  faixaEtaria: string;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  professorId?: number;
  limiteAlunos?: number;
  curriculoId?: number;
}

export class UpdateTurmaService {
  async execute(id: number, data: UpdateTurmaDTO) {
    const turmaExistente = await prisma.turma.findUnique({ where: { id } });

    if (!turmaExistente) {
      throw new AppError("Turma não encontrada.");
    }

    return prisma.turma.update({
      where: { id },
      data,
      include: {
        professor: {
          select: { id: true, nome: true, apelido: true },
        },
        curriculo: true,
      },
    });
  }
}
