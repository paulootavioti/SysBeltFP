import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class CancelarAulaProgramadaService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const programacao = await prisma.aulaProgramada.findUnique({
      where: { id },
      include: { turma: true },
    });

    if (!programacao) {
      throw new AppError("Programação não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, programacao.unidadeId, "Programação não encontrada.");

    if (programacao.status !== "PENDENTE") {
      throw new AppError("Só é possível cancelar uma programação pendente.");
    }

    return prisma.aulaProgramada.update({
      where: { id },
      data: { status: "CANCELADA" },
      include: { turma: true },
    });
  }
}
