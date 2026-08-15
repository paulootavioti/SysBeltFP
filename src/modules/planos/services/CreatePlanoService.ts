import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

interface CreatePlanoDTO {
  unidadeId: number;
  nome: string;
  valor: number;
  periodicidade: string;
}

export class CreatePlanoService {
  async execute(data: CreatePlanoDTO) {
    const prisma = prismaDaRequisicao();
    return prisma.plano.create({
      data,
    });
  }
}
