import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DeleteAulaCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const aulaCurriculo = await prisma.aulaCurriculo.findUnique({
      where: { id },
      include: { modulo: { include: { curriculo: true } } },
    });

    if (!aulaCurriculo) {
      throw new AppError("Aula do currículo não encontrada.");
    }

    garantirAcessoUnidade(
      unidadeId,
      aulaCurriculo.modulo.curriculo.unidadeId,
      "Aula do currículo não encontrada."
    );

    const [aulasRealizadas, aulasProgramadas] = await Promise.all([
      prisma.aula.count({ where: { aulaCurriculoId: id } }),
      prisma.aulaProgramada.count({ where: { aulaCurriculoId: id } }),
    ]);

    if (aulasRealizadas > 0 || aulasProgramadas > 0) {
      throw new AppError(
        "Não é possível excluir: há aulas realizadas ou programadas vinculadas a esta aula planejada."
      );
    }

    await prisma.$transaction([
      prisma.tecnicaCurriculo.deleteMany({ where: { aulaCurriculoId: id } }),
      prisma.aulaCurriculo.delete({ where: { id } }),
    ]);
  }
}
