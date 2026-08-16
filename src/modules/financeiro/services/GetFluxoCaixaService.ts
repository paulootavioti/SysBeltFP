import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { agruparPorBucket, calcularRangePeriodo, type Periodo } from "../../dashboard/utils/periodo";
import type { FiltrosFinanceiro } from "../utils/filtros";

export interface PontoFluxoCaixa {
  rotulo: string;
  recebido: number;
  previsto: number;
}

// Série temporal de recebido (por dataPagamento) x previsto (por
// vencimento) no período — mesma técnica de bucket usada pelo dashboard
// geral (`agruparPorBucket`), pra manter os dois gráficos consistentes.
export class GetFluxoCaixaService {
  async execute(unidadeId: number | null, filtros: FiltrosFinanceiro = {}): Promise<PontoFluxoCaixa[]> {
    const prisma = prismaDaRequisicao();
    const periodo: Periodo = filtros.periodo ?? "MENSAL";
    const range = calcularRangePeriodo(periodo);
    const unidade = escopoUnidade(unidadeId);

    const filtroUnidadeExtra =
      unidadeId === null && filtros.unidadeId ? { unidadeId: filtros.unidadeId } : {};

    const filtroProfessor = filtros.professorId
      ? { aluno: { turma: { professorId: filtros.professorId } } }
      : {};

    const [previstas, recebidas] = await Promise.all([
      prisma.mensalidade.findMany({
        where: {
          ...unidade,
          ...filtroUnidadeExtra,
          ...filtroProfessor,
          vencimento: { gte: range.inicio, lt: range.fim },
        },
        select: { vencimento: true, valorFinal: true },
      }),
      prisma.mensalidade.findMany({
        where: {
          ...unidade,
          ...filtroUnidadeExtra,
          ...filtroProfessor,
          status: "PAGA",
          dataPagamento: { gte: range.inicio, lt: range.fim },
        },
        select: { dataPagamento: true, valorFinal: true },
      }),
    ]);

    const bucketsPrevisto = agruparPorBucket(range, previstas, (item) => item.vencimento);
    const bucketsRecebido = agruparPorBucket(range, recebidas, (item) => item.dataPagamento as Date);

    return bucketsPrevisto.map((bucket, indice) => ({
      rotulo: bucket.rotulo,
      previsto: bucket.itens.reduce((soma, item) => soma + item.valorFinal, 0),
      recebido: bucketsRecebido[indice].itens.reduce((soma, item) => soma + item.valorFinal, 0),
    }));
  }
}
