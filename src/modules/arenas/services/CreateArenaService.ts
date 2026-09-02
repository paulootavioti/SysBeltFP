import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateArenaDTO {
  unidadeId: number;
  nome: string;
}

export class CreateArenaService {
  async execute(data: CreateArenaDTO) {
    const prisma = prismaDaRequisicao();
    const unidade = await prisma.unidade.findUnique({
      where: { id: data.unidadeId },
      select: { id: true, ativo: true },
    });

    if (!unidade || !unidade.ativo) {
      throw new AppError("Unidade ativa não encontrada.");
    }

    garantirAcessoUnidade(null, unidade.id, "Unidade ativa não encontrada.");

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
