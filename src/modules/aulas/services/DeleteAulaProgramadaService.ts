import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteAulaProgramadaService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const programacao = await prisma.aulaProgramada.findUnique({ where: { id } });

    if (!programacao) {
      throw new AppError("Programação não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, programacao.unidadeId, "Programação não encontrada.");

    await prisma.aulaProgramada.delete({ where: { id } });
  }
}
