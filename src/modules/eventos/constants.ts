export const TIPOS_EVENTO = [
  "CAMPANHA_MATRICULA",
  "CAMPANHA_PROMOCIONAL",
  "CAMPANHA_INDICACAO",
  "SEMINARIO",
  "WORKSHOP",
  "AULAO",
  "COMPETICAO",
  "OUTRO",
] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const STATUS_EVENTO = ["RASCUNHO", "AGENDADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"] as const;
export type StatusEvento = (typeof STATUS_EVENTO)[number];
