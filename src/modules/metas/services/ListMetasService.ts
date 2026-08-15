import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { GetResumoPeriodoService } from "../../dashboard/services/GetResumoPeriodoService";
import { TIPOS_META_REDUCAO, type FormatoValorMeta, type StatusMeta, type TipoMeta } from "../constants";

export interface MetaComProgresso {
  id: number;
  nome: string;
  tipo: TipoMeta;
  valorAtual: number;
  valorMeta: number;
  percentualAtingido: number;
  unidade: FormatoValorMeta;
  status: StatusMeta;
  dataLimite: string;
}

// valorAtual nunca é armazenado — é sempre calculado ao vivo a partir do
// resumo do período MENSAL corrente da unidade da meta (mesmos KPIs do
// dashboard), pra nunca ficar desatualizado.
function valorAtualDoTipo(tipo: TipoMeta, kpis: Awaited<ReturnType<GetResumoPeriodoService["execute"]>>["kpis"]): number {
  switch (tipo) {
    case "RECEITA":
      return kpis.receita;
    case "NOVAS_MATRICULAS":
      return kpis.novosAlunos;
    case "ALUNOS_ATIVOS":
      return kpis.alunosAtivos;
    case "FREQUENCIA":
      return kpis.taxaFrequencia;
    case "INADIMPLENCIA":
      return kpis.taxaInadimplencia;
    case "RETENCAO": {
      // aproximação: parte da base de alunos ativos no início do período
      // (mesmo cálculo usado pra variação de alunosAtivos) que não foi
      // perdida por cancelamento.
      const baseInicioPeriodo = kpis.alunosAtivos - kpis.saldoAlunos;
      if (baseInicioPeriodo <= 0) return 100;
      return Math.max(0, 100 - (kpis.cancelamentos / baseInicioPeriodo) * 100);
    }
  }
}

function calcularPercentual(tipo: TipoMeta, valorAtual: number, valorMeta: number): number {
  if (TIPOS_META_REDUCAO.includes(tipo)) {
    return (valorMeta / Math.max(valorAtual, 0.0001)) * 100;
  }
  return (valorAtual / valorMeta) * 100;
}

function calcularStatus(percentual: number, dataLimite: Date): StatusMeta {
  if (percentual >= 100) return "ATINGIDA";
  if (dataLimite < new Date()) return "ATRASADA";
  if (percentual <= 0) return "NAO_INICIADA";
  return "EM_ANDAMENTO";
}

export class ListMetasService {
  async execute(unidadeId: number | null): Promise<MetaComProgresso[]> {
    const prisma = prismaDaRequisicao();
    const metas = await prisma.meta.findMany({
      where: escopoUnidade(unidadeId),
      orderBy: { dataLimite: "asc" },
    });

    const unidadesDistintas = Array.from(new Set(metas.map((meta) => meta.unidadeId)));
    const resumoService = new GetResumoPeriodoService();

    const resumosPorUnidade = new Map(
      await Promise.all(
        unidadesDistintas.map(async (id) => [id, await resumoService.execute("MENSAL", id)] as const)
      )
    );

    return metas.map((meta) => {
      const resumo = resumosPorUnidade.get(meta.unidadeId);
      const valorAtual = resumo ? valorAtualDoTipo(meta.tipo as TipoMeta, resumo.kpis) : 0;
      const percentual = calcularPercentual(meta.tipo as TipoMeta, valorAtual, meta.valorMeta);

      return {
        id: meta.id,
        nome: meta.nome,
        tipo: meta.tipo as TipoMeta,
        valorAtual,
        valorMeta: meta.valorMeta,
        percentualAtingido: percentual,
        unidade: meta.formatoValor as FormatoValorMeta,
        status: calcularStatus(percentual, meta.dataLimite),
        dataLimite: meta.dataLimite.toISOString(),
      };
    });
  }
}
