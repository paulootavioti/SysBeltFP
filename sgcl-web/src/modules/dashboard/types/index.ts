export type PeriodoOpcao = "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL";

// null = sem base de comparação (período anterior zerado, atual não) — o
// componente deve mostrar "Novo no período", nunca inventar uma %.
export interface Variacao {
  percentual: number | null;
}

export interface DashboardKpisPeriodo {
  receita: number;
  receitaPrevista: number;
  receitaPendente: number;
  receitaVencida: number;
  receitaMedia: number;
  ticketMedio: number;

  presencas: number;
  faltas: number;
  presencasEsperadas: number;
  taxaFrequencia: number;

  novosAlunos: number;
  cancelamentos: number;
  saldoAlunos: number;
  mediaNovasMatriculas: number;
  unidadeMediaNovasMatriculas: string;

  alunosAtivos: number;
  alunosPagantes: number;

  graduacoes: number;

  mensalidadesGeradas: number;
  mensalidadesPendentes: number;
  mensalidadesVencidas: number;
  taxaInadimplencia: number;

  variacaoReceita: number | null;
  variacaoNovasMatriculas: number | null;
  variacaoFrequencia: number | null;
  variacaoAlunosAtivos: number | null;
}

export interface DashboardSerieFinanceira {
  label: string;
  recebido: number;
  previsto: number;
  pendente: number;
  vencido: number;
}

export interface DashboardSerieFrequencia {
  label: string;
  presencas: number;
  faltas: number;
  taxaFrequencia: number;
}

export interface DashboardSerieMatriculas {
  label: string;
  novasMatriculas: number;
  cancelamentos: number;
  saldo: number;
}

export interface DashboardSerieSimples {
  label: string;
  valor: number;
}

export interface DashboardResumoPeriodo {
  periodo: PeriodoOpcao;
  dataInicial: string;
  dataFinal: string;
  kpis: DashboardKpisPeriodo;

  seriesReceita: DashboardSerieFinanceira[];
  seriesFrequencia: DashboardSerieFrequencia[];
  seriesMatriculas: DashboardSerieMatriculas[];
  seriesAlunosAtivos: DashboardSerieSimples[];
}

export type PrioridadeAlerta = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export interface AlertaDashboard {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: PrioridadeAlerta;
  quantidade?: number;
  rota?: string;
}

export interface UnidadeDashboard {
  id: number;
  nome: string;
  tipo: "UNIDADE" | "ARENA";
  cidade?: string;
  bairro?: string;
  alunosAtivos: number;
  professores: number;
  turmasAtivas: number;
  receitaPeriodo: number;
  mensalidadesVencidas: number;
  taxaFrequencia: number;
  proximoEvento?: {
    id: string;
    titulo: string;
    dataInicio: string;
  };
  status: "ATIVA" | "INATIVA" | "EM_IMPLANTACAO";
}
