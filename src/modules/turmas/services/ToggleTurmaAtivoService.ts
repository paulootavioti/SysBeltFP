import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ToggleTurmaAtivoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const turma = await prisma.turma.findUnique({ where: { id } });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    return prisma.turma.update({
      where: { id },
      data: { ativo: !turma.ativo },
    });
  }
}
