import { prisma } from "../../../shared/database/prisma";

interface CreateTurmaDTO {
  nome: string;
  faixaEtaria: string;
  diasSemana: string;
  horarioInicio: string;
  horarioFim: string;
  professor: string;
  limiteAlunos?: number;
}

export class CreateTurmaService {
  async execute(data: CreateTurmaDTO) {

    return prisma.turma.create({
      data
    });

  }
}