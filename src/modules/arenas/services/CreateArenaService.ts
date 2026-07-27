import { prisma } from "../../../shared/database/prisma";

interface CreateArenaDTO {
  unidadeId: number;
  nome: string;
}

export class CreateArenaService {
  async execute(data: CreateArenaDTO) {
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
