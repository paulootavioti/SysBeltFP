import { prisma } from "../../../shared/database/prisma";

interface CreateSalaDTO {
  unidadeId: number;
  nome: string;
}

export class CreateSalaService {
  async execute(data: CreateSalaDTO) {
    return prisma.sala.create({
      data,
    });
  }
}
