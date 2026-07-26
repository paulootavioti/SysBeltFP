import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

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
  async execute(id: number, data: UpdateTurmaDTO, unidadeId: number | null) {
    const turmaExistente = await prisma.turma.findUnique({ where: { id } });

    if (!turmaExistente) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turmaExistente.unidadeId, "Turma não encontrada.");

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
