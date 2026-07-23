import { prisma } from "../../../shared/database/prisma";
import { calcularRangeContagem, type PeriodoContagem } from "../utils/periodoContagem";

export class GetResumoTurmasAulasService {
  async execute(periodo: PeriodoContagem, referencia: Date = new Date()) {
    const { inicio, fim } = calcularRangeContagem(periodo, referencia);

    const turmas = await prisma.turma.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        _count: {
          select: {
            aulas: { where: { data: { gte: inicio, lte: fim } } },
          },
        },
      },
    });

    return turmas.map((turma) => ({
      turmaId: turma.id,
      turmaNome: turma.nome,
      quantidade: turma._count.aulas,
    }));
  }
}
