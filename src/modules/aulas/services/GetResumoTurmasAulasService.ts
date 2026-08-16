import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { calcularRangeContagem, type PeriodoContagem } from "../utils/periodoContagem";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetResumoTurmasAulasService {
  async execute(periodo: PeriodoContagem, unidadeId: number | null, referencia: Date = new Date()) {
    const prisma = prismaDaRequisicao();
    const { inicio, fim } = calcularRangeContagem(periodo, referencia);

    const turmas = await prisma.turma.findMany({
      where: { ativo: true, ...escopoUnidade(unidadeId) },
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
