export type TipoEvento =
  | "CAMPANHA_MATRICULA"
  | "CAMPANHA_PROMOCIONAL"
  | "CAMPANHA_INDICACAO"
  | "SEMINARIO"
  | "WORKSHOP"
  | "AULAO"
  | "COMPETICAO"
  | "OUTRO";

export type StatusEvento = "RASCUNHO" | "AGENDADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

export interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: TipoEvento;
  status: StatusEvento;
  dataInicio: string;
  dataFim?: string;
  local?: string;
  unidadeId: number;
  metaParticipantes?: number;
  participantesConfirmados?: number;
  investimento?: number;
  receitaGerada?: number;
  responsavel?: string;
}

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  CAMPANHA_MATRICULA: "Campanha de Matrícula",
  CAMPANHA_PROMOCIONAL: "Campanha Promocional",
  CAMPANHA_INDICACAO: "Campanha de Indicação",
  SEMINARIO: "Seminário",
  WORKSHOP: "Workshop",
  AULAO: "Aulão",
  COMPETICAO: "Competição",
  OUTRO: "Outro",
};

export const STATUS_EVENTO_LABEL: Record<StatusEvento, string> = {
  RASCUNHO: "Rascunho",
  AGENDADO: "Agendado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};
