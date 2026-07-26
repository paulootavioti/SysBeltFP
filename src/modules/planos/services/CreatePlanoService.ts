import { prisma } from "../../../shared/database/prisma";

interface CreatePlanoDTO {
  unidadeId: number;
  nome: string;
  valor: number;
  periodicidade: string;
}

export class CreatePlanoService {
  async execute(data: CreatePlanoDTO) {
    return prisma.plano.create({
      data,
    });
  }
}
