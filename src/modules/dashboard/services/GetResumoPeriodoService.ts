import { prisma } from "../../../shared/database/prisma";
import {
  agruparPorBucket,
  calcularRangePeriodo,
  calcularRangePeriodoAnterior,
  calcularVariacaoPercentual,
  divisoesDoPeriodo,
  montarSerie,
  type Periodo,
  type RangePeriodo,
} from "../utils/periodo";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface DadosPeriodo {
  presencas: { presente: boolean; data: Date }[];
  mensalidadesPorVencimento: { valor: number; vencimento: Date; pago: boolean }[];
  mensalidadesPagas: { valor: number; dataPagamento: Date; alunoId: number }[];
  alunosNovos: Date[];
  alunosCancelados: Date[];
  graduacoes: number;
}

// Um aluno só é considerado "cancelado" no período por aproximação: não há
// campo de data de cancelamento no schema hoje, então usamos
// `ativo=false` + `updatedAt` dentro do período. Qualquer outra edição de
// um aluno já inativo, ou uma reativação seguida de nova inativação fora
// do período, pode distorcer esse número — ver ADR pendente / roadmap.
async function buscarDadosPeriodo(range: RangePeriodo, unidadeId: number | null): Promise<DadosPeriodo> {
  const unidade = escopoUnidade(unidadeId);

  const [presencas, mensalidadesPorVencimento, mensalidadesPagas, alunosNovos, alunosCancelados, graduacoes] =
    await Promise.all([
      prisma.aulaAluno.findMany({
        where: { aula: { data: { gte: range.inicio, lt: range.fim }, ...unidade } },
        select: { presente: true, aula: { select: { data: true } } },
      }),
      prisma.mensalidade.findMany({
        where: { vencimento: { gte: range.inicio, lt: range.fim }, ...unidade },
        select: { valor: true, vencimento: true, pago: true },
      }),
      prisma.mensalidade.findMany({
        where: { pago: true, dataPagamento: { gte: range.inicio, lt: range.fim }, ...unidade },
        select: { valor: true, dataPagamento: true, alunoId: true },
      }),
      prisma.aluno.findMany({
        where: { createdAt: { gte: range.inicio, lt: range.fim }, ...unidade },
        select: { createdAt: true },
      }),
      prisma.aluno.findMany({
        where: { ativo: false, updatedAt: { gte: range.inicio, lt: range.fim }, ...unidade },
        select: { updatedAt: true },
      }),
      prisma.graduacao.count({
        where: { data: { gte: range.inicio, lt: range.fim }, ...unidade },
      }),
    ]);

  return {
    presencas: presencas.map((p) => ({ presente: p.presente, data: p.aula.data })),
    mensalidadesPorVencimento,
    mensalidadesPagas: mensalidadesPagas.map((m) => ({ ...m, dataPagamento: m.dataPagamento as Date })),
    alunosNovos: alunosNovos.map((a) => a.createdAt),
    alunosCancelados: alunosCancelados.map((a) => a.updatedAt),
    graduacoes,
  };
}

export class GetResumoPeriodoService {
  async execute(periodo: Periodo, unidadeId: number | null) {
    const agora = new Date();
    const range = calcularRangePeriodo(periodo, agora);
    const rangeAnterior = calcularRangePeriodoAnterior(periodo, agora);

    const [dados, dadosAnterior, alunosAtivos] = await Promise.all([
      buscarDadosPeriodo(range, unidadeId),
      buscarDadosPeriodo(rangeAnterior, unidadeId),
      prisma.aluno.count({ where: { ativo: true, ...escopoUnidade(unidadeId) } }),
    ]);

    const hoje = new Date();
    const divisoes = divisoesDoPeriodo(periodo, agora);

    // ----- Frequência -----
    const presencasCount = dados.presencas.filter((p) => p.presente).length;
    const faltasCount = dados.presencas.filter((p) => !p.presente).length;
    const presencasEsperadas = dados.presencas.length;
    const taxaFrequencia = presencasEsperadas > 0 ? (presencasCount / presencasEsperadas) * 100 : 0;

    const presencasAnteriorCount = dadosAnterior.presencas.filter((p) => p.presente).length;
    const presencasEsperadasAnterior = dadosAnterior.presencas.length;
    const taxaFrequenciaAnterior =
      presencasEsperadasAnterior > 0 ? (presencasAnteriorCount / presencasEsperadasAnterior) * 100 : 0;

    // ----- Financeiro -----
    const receita = dados.mensalidadesPagas.reduce((soma, m) => soma + m.valor, 0);
    const receitaAnterior = dadosAnterior.mensalidadesPagas.reduce((soma, m) => soma + m.valor, 0);

    const receitaPrevista = dados.mensalidadesPorVencimento.reduce((soma, m) => soma + m.valor, 0);
    const pendentesNoPeriodo = dados.mensalidadesPorVencimento.filter((m) => !m.pago);
    const receitaPendente = pendentesNoPeriodo
      .filter((m) => m.vencimento >= hoje)
      .reduce((soma, m) => soma + m.valor, 0);
    const receitaVencida = pendentesNoPeriodo
      .filter((m) => m.vencimento < hoje)
      .reduce((soma, m) => soma + m.valor, 0);

    const mensalidadesGeradas = dados.mensalidadesPorVencimento.length;
    const mensalidadesPendentes = pendentesNoPeriodo.filter((m) => m.vencimento >= hoje).length;
    const mensalidadesVencidas = pendentesNoPeriodo.filter((m) => m.vencimento < hoje).length;
    const taxaInadimplencia = mensalidadesGeradas > 0 ? (mensalidadesVencidas / mensalidadesGeradas) * 100 : 0;

    const alunosPagantes = new Set(dados.mensalidadesPagas.map((m) => m.alunoId)).size;
    const ticketMedio = alunosPagantes > 0 ? receita / alunosPagantes : 0;
    const receitaMedia = receita / divisoes.quantidade;

    // ----- Matrículas -----
    const novosAlunos = dados.alunosNovos.length;
    const novosAlunosAnterior = dadosAnterior.alunosNovos.length;
    const cancelamentos = dados.alunosCancelados.length;
    const saldoAlunos = novosAlunos - cancelamentos;
    const mediaNovasMatriculas = novosAlunos / divisoes.quantidade;

    // Não existe uma tabela de snapshot histórico de "alunos ativos por
    // dia" — a única contagem confiável é a de agora. Pra estimar o valor
    // no fim do período anterior, subtraímos o saldo líquido deste
    // período do total atual (aproximação; ver comentário em
    // `buscarDadosPeriodo` sobre a limitação de "cancelamentos").
    const alunosAtivosAnteriorAprox = alunosAtivos - saldoAlunos;

    // ----- Variações vs período anterior -----
    const variacaoReceita = calcularVariacaoPercentual(receita, receitaAnterior).percentual;
    const variacaoNovasMatriculas = calcularVariacaoPercentual(novosAlunos, novosAlunosAnterior).percentual;
    const variacaoFrequencia = calcularVariacaoPercentual(taxaFrequencia, taxaFrequenciaAnterior).percentual;
    const variacaoAlunosAtivos = calcularVariacaoPercentual(alunosAtivos, alunosAtivosAnteriorAprox).percentual;

    // ----- Séries (gráficos) -----
    const seriesFrequencia = agruparPorBucket(range, dados.presencas, (p) => p.data).map((bucket) => {
      const presentes = bucket.itens.filter((p) => p.presente).length;
      const faltas = bucket.itens.filter((p) => !p.presente).length;
      const esperadas = bucket.itens.length;
      return {
        label: bucket.rotulo,
        presencas: presentes,
        faltas,
        taxaFrequencia: esperadas > 0 ? (presentes / esperadas) * 100 : 0,
      };
    });

    const bucketsRecebido = agruparPorBucket(range, dados.mensalidadesPagas, (m) => m.dataPagamento);
    const bucketsPrevisto = agruparPorBucket(range, dados.mensalidadesPorVencimento, (m) => m.vencimento);

    const seriesReceita = bucketsRecebido.map((bucket, indice) => {
      const previstoBucket = bucketsPrevisto[indice].itens;
      return {
        label: bucket.rotulo,
        recebido: bucket.itens.reduce((soma, m) => soma + m.valor, 0),
        previsto: previstoBucket.reduce((soma, m) => soma + m.valor, 0),
        pendente: previstoBucket
          .filter((m) => !m.pago && m.vencimento >= hoje)
          .reduce((soma, m) => soma + m.valor, 0),
        vencido: previstoBucket
          .filter((m) => !m.pago && m.vencimento < hoje)
          .reduce((soma, m) => soma + m.valor, 0),
      };
    });

    const bucketsNovos = agruparPorBucket(range, dados.alunosNovos, (data) => data);
    const bucketsCancelados = agruparPorBucket(range, dados.alunosCancelados, (data) => data);

    const seriesMatriculas = bucketsNovos.map((bucket, indice) => {
      const novasNoBucket = bucket.itens.length;
      const canceladosNoBucket = bucketsCancelados[indice].itens.length;
      return {
        label: bucket.rotulo,
        novasMatriculas: novasNoBucket,
        cancelamentos: canceladosNoBucket,
        saldo: novasNoBucket - canceladosNoBucket,
      };
    });

    // Evolução de alunos ativos: não há snapshot histórico, então a série é
    // reconstruída "de trás pra frente" a partir do total ativo agora,
    // removendo o saldo líquido de cada bucket mais recente — o último
    // ponto da série sempre bate com o número real de hoje.
    const seriesAlunosAtivos: { label: string; valor: number }[] = new Array(seriesMatriculas.length);
    let acumulado = alunosAtivos;
    for (let i = seriesMatriculas.length - 1; i >= 0; i--) {
      seriesAlunosAtivos[i] = { label: seriesMatriculas[i].label, valor: acumulado };
      acumulado -= seriesMatriculas[i].saldo;
    }

    return {
      periodo,
      dataInicial: range.inicio.toISOString(),
      dataFinal: range.fim.toISOString(),
      kpis: {
        receita,
        receitaPrevista,
        receitaPendente,
        receitaVencida,
        receitaMedia,
        ticketMedio,

        presencas: presencasCount,
        faltas: faltasCount,
        presencasEsperadas,
        taxaFrequencia,

        novosAlunos,
        cancelamentos,
        saldoAlunos,
        mediaNovasMatriculas,
        unidadeMediaNovasMatriculas: divisoes.unidadeTexto,

        alunosAtivos,
        alunosPagantes,

        graduacoes: dados.graduacoes,

        mensalidadesGeradas,
        mensalidadesPendentes,
        mensalidadesVencidas,
        taxaInadimplencia,

        variacaoReceita,
        variacaoNovasMatriculas,
        variacaoFrequencia,
        variacaoAlunosAtivos,
      },
      seriesReceita,
      seriesFrequencia,
      seriesMatriculas,
      seriesAlunosAtivos,
    };
  }
}
