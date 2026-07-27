import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { buscarConflitoTurma, mensagemConflitoTurma } from "../../../shared/utils/conflitoHorario";

interface CreateTurmaDTO {
  unidadeId: number;
  nome: string;
  faixaEtaria: string;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  professorId?: number;
  arenaId?: number;
  limiteAlunos?: number;
  curriculoId?: number;
}

export class CreateTurmaService {
  async execute(data: CreateTurmaDTO) {

    const conflito = await buscarConflitoTurma({
      unidadeId: data.unidadeId,
      diasSemana: data.diasSemana,
      horarioInicio: data.horarioInicio,
      horarioFim: data.horarioFim,
      arenaId: data.arenaId,
      professorId: data.professorId,
    });

    if (conflito) {
      throw new AppError(mensagemConflitoTurma(conflito));
    }

    return prisma.turma.create({
      data,
      include: {
        professor: {
          select: {
            id: true,
            nome: true,
            apelido: true,
          },
        },
        arena: true,
        curriculo: true,
      },
    });

  }
}
