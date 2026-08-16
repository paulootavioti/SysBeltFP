import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteModuloCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modulo = await prisma.moduloCurriculo.findUnique({
      where: { id },
      include: { curriculo: true },
    });

    if (!modulo) {
      throw new AppError("Módulo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modulo.curriculo.unidadeId, "Módulo não encontrado.");

    const aulasCurriculo = await prisma.aulaCurriculo.findMany({
      where: { moduloId: id },
      select: { id: true },
    });

    const aulaCurriculoIds = aulasCurriculo.map((item) => item.id);

    if (aulaCurriculoIds.length > 0) {
      const [aulasRealizadas, aulasProgramadas] = await Promise.all([
        prisma.aula.count({ where: { aulaCurriculoId: { in: aulaCurriculoIds } } }),
        prisma.aulaProgramada.count({ where: { aulaCurriculoId: { in: aulaCurriculoIds } } }),
      ]);

      if (aulasRealizadas > 0 || aulasProgramadas > 0) {
        throw new AppError(
          "Não é possível excluir: há aulas realizadas ou programadas vinculadas a este módulo."
        );
      }
    }

    await prisma.$transaction([
      prisma.tecnicaCurriculo.deleteMany({ where: { aulaCurriculo: { moduloId: id } } }),
      prisma.aulaCurriculo.deleteMany({ where: { moduloId: id } }),
      prisma.moduloCurriculo.delete({ where: { id } }),
    ]);
  }
}
