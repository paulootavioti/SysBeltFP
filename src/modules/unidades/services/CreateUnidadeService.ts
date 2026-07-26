import { prisma } from "../../../shared/database/prisma";

interface CreateUnidadeDTO {
  nome: string;
}

export class CreateUnidadeService {
  async execute(data: CreateUnidadeDTO) {
    return prisma.unidade.create({ data });
  }
}
