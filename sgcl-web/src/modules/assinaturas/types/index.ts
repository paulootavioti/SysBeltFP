export type StatusAssinatura = "ATIVA" | "PAUSADA" | "CANCELADA" | "CONCLUIDA";

export const STATUS_ASSINATURA_LABEL: Record<StatusAssinatura, string> = {
  ATIVA: "Ativa",
  PAUSADA: "Pausada",
  CANCELADA: "Cancelada",
  CONCLUIDA: "Concluída",
};

export interface Assinatura {
  id: number;
  unidadeId: number;
  alunoId: number;
  planoId?: number | null;
  formaPagamentoId?: number | null;
  valor: number;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string | null;
  indeterminado: boolean;
  numeroParcelas?: number | null;
  parcelasGeradas: number;
  desconto: number;
  acrescimo: number;
  multa: number;
  juros: number;
  descontoPontualidade: number;
  status: StatusAssinatura;
  ultimaCobrancaGeradaEm?: string | null;
  createdAt: string;
  updatedAt: string;

  aluno?: { id: number; nome: string };
  plano?: { id: number; nome: string } | null;
  formaPagamento?: { id: number; tipo: string; nomePersonalizado?: string | null } | null;
}

export interface ResultadoGeracaoCobrancas {
  geradas: number;
  ignoradasPorDuplicidade: number;
  concluidas: number;
}
