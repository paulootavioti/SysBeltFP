import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { buscarConflitoProgramacao, mensagemConflitoProgramacao } from "../../../shared/utils/conflitoHorario";

interface CreateAulaProgramadaDTO {
  turmaId: number;
  aulaCurriculoId?: number;
  data: string;
  observacoes?: string;
}

export class CreateAulaProgramadaService {
  async execute(data: CreateAulaProgramadaDTO, unidadeId: number | null) {
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    if (data.aulaCurriculoId) {
      const aulaCurriculo = await prisma.aulaCurriculo.findUnique({
        where: { id: data.aulaCurriculoId },
      });

      if (!aulaCurriculo) {
        throw new AppError("Aula do currículo não encontrada.");
      }
    }

    const conflito = await buscarConflitoProgramacao({
      unidadeId: turma.unidadeId,
      turmaId: turma.id,
      salaId: turma.salaId,
      professorId: turma.professorId,
      horarioInicio: turma.horarioInicio,
      horarioFim: turma.horarioFim,
      datas: [new Date(data.data)],
    });

    if (conflito) {
      throw new AppError(mensagemConflitoProgramacao(conflito));
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