import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteTecnicaCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const tecnicaCurriculo = await prisma.tecnicaCurriculo.findUnique({
      where: { id },
      include: { aulaCurriculo: { include: { modulo: { include: { curriculo: true } } } } },
    });

    if (!tecnicaCurriculo) {
      throw new AppError("Técnica não encontrada.");
    }

    garantirAcessoUnidade(
      unidadeId,
      tecnicaCurriculo.aulaCurriculo.modulo.curriculo.unidadeId,
      "Técnica não encontrada."
    );

    await prisma.tecnicaCurriculo.delete({ where: { id } });
  }
}
