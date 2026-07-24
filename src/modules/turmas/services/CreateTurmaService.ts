import { prisma } from "../../../shared/database/prisma";

interface CreateTurmaDTO {
  nome: string;
  faixaEtaria: string;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  professorId?: number;
  limiteAlunos?: number;
  curriculoId?: number;
}

export class CreateTurmaService {
  async execute(data: CreateTurmaDTO) {

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
        curriculo: true,
      },
    });

  }
}