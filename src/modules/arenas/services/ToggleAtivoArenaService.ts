import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleAtivoArenaService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const arena = await prisma.arena.findUnique({ where: { id } });

    if (!arena) {
      throw new AppError("Arena não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, arena.unidadeId, "Arena não encontrada.");

    return prisma.arena.update({
      where: { id },
      data: { ativo: !arena.ativo },
    });
  }
}
