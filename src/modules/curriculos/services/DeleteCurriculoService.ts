import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export class DeleteCurriculoService {
  async execute(id: number) {
    const turmasVinculadas = await prisma.turma.count({
      where: { curriculoId: id },
    });

    if (turmasVinculadas > 0) {
      throw new AppError(
        "Não é possível excluir: existem turmas vinculadas a este currículo."
      );
    }

    const aulasCurriculo = await prisma.aulaCurriculo.findMany({
      where: { modulo: { curriculoId: id } },
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
          "Não é possível excluir: há aulas realizadas ou programadas vinculadas a este currículo."
        );
      }
    }

    await prisma.$transaction([
      prisma.tecnicaCurriculo.deleteMany({
        where: { aulaCurriculo: { modulo: { curriculoId: id } } },
      }),
      prisma.aulaCurriculo.deleteMany({
        where: { modulo: { curriculoId: id } },
      }),
      prisma.moduloCurriculo.deleteMany({ where: { curriculoId: id } }),
      prisma.curriculo.delete({ where: { id } }),
    ]);
  }
}
