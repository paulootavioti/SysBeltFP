import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

interface CreateArenaDTO {
  unidadeId: number;
  nome: string;
}

export class CreateArenaService {
  async execute(data: CreateArenaDTO) {
    const prisma = prismaDaRequisicao();
    return prisma.arena.create({
      data,
      include: {
        unidade: {
          select: { id: true, nome: true },
        },
      },
    });
  }
}
