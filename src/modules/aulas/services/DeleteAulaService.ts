import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteAulaService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({ where: { id } });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, aula.unidadeId, "Aula não encontrada.");

    await prisma.$transaction([
      prisma.aulaProgramada.updateMany({
        where: { aulaId: id },
        data: { aulaId: null, status: "PENDENTE" },
      }),
      prisma.aulaAluno.deleteMany({ where: { aulaId: id } }),
      prisma.aula.delete({ where: { id } }),
    ]);
  }
}
