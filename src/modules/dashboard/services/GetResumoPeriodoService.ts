import { prisma } from "../../../shared/database/prisma";
import { calcularRangePeriodo, montarSerie, type Periodo } from "../utils/periodo";

export class GetResumoPeriodoService {
  async execute(periodo: Periodo) {
    const range = calcularRangePeriodo(periodo);

    const [presencas, mensalidadesPagas, alunosNovos, graduacoesNoPeriodo] = await Promise.all([
      prisma.aulaAluno.findMany({
        where: { presente: true, aula: { data: { gte: range.inicio, lt: range.fim } } },
        select: { aula: { select: { data: true } } },
      }),
      prisma.mensalidade.findMany({
        where: { pago: true, dataPagamento: { gte: range.inicio, lt: range.fim } },
        select: { valor: true, dataPagamento: true },
      }),
      prisma.aluno.findMany({
        where: { createdAt: { gte: range.inicio, lt: range.fim } },
        select: { createdAt: true },
      }),
      prisma.graduacao.count({
        where: { data: { gte: range.inicio, lt: range.fim } },
      }),
    ]);

    const seriesFrequencia = montarSerie(
      range,
      presencas.map((p) => p.aula.data)
    );

    const seriesReceita = montarSerie(
      range,
      mensalidadesPagas.map((m) => m.dataPagamento as Date),
      (indice) => mensalidadesPagas[indice].valor
    );

    const seriesNovasMatriculas = montarSerie(
      range,
      alunosNovos.map((a) => a.createdAt)
    );

    return {
      periodo,
      rangeInicio: range.inicio.toISOString(),
      rangeFim: range.fim.toISOString(),
      kpis: {
        presencas: presencas.length,
        receita: mensalidadesPagas.reduce((soma, m) => soma + m.valor, 0),
        novosAlunos: alunosNovos.length,
        graduacoes: graduacoesNoPeriodo,
      },
      seriesReceita,
      seriesFrequencia,
      seriesNovasMatriculas,
    };
  }
}
