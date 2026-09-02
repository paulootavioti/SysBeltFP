import type { PeriodoOpcao } from "../../dashboard/types";
import type { MensalidadeComAluno } from "../../mensalidades/types";

export type { PeriodoOpcao };

export interface FiltrosFinanceiro {
  periodo?: PeriodoOpcao;
  unidadeId?: number;
  professorId?: number;
}

export interface FinanceiroResumo {
  totalRecebido: number;
  totalPendente: number;
  inadimplentes: number;
}

export interface PontoFluxoCaixa {
  rotulo: string;
  recebido: number;
  previsto: number;
}

export interface DashboardFinanceiro {
  receitaPrevista: number;
  receitaRecebida: number;
  receitaRecorrente: number;
  receitaPorUnidade: { unidadeId: number; unidade: string; valor: number }[];
  receitaPorProfessor: { professorId: number; professor: string; valor: number }[];
  ticketMedio: number;
  taxaInadimplencia: number;
  mensalidadesVencidas: number;
  mensalidadesPagas: number;
  cobrancasRecorrentesAtivas: number;
  proximosVencimentos: {
    id: number;
    aluno: string;
    valorFinal: number;
    vencimento: string;
  }[];
}

export type ContaFinanceira = MensalidadeComAluno;

export interface CobrancaPagamento {
  id: number;
  gateway: string;
  gatewayId?: string | null;
  status: string;
  numeroTentativa: number;
  erro?: string | null;
  consultadoEm?: string | null;
  reconciliadoEm?: string | null;
  createdAt: string;
  mensalidade: {
    id: number;
    valor: number;
    valorFinal: number;
    vencimento: string;
    status: string;
    aluno: { id: number; nome: string };
  } | null;
  pedido: {
    id: number;
    total: number;
    status: string;
    aluno: { id: number; nome: string };
  } | null;
}
