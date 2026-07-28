export const TIPOS_META = [
  "RECEITA",
  "NOVAS_MATRICULAS",
  "ALUNOS_ATIVOS",
  "FREQUENCIA",
  "INADIMPLENCIA",
  "RETENCAO",
] as const;

export type TipoMeta = (typeof TIPOS_META)[number];

export const FORMATOS_VALOR = ["MOEDA", "QUANTIDADE", "PERCENTUAL"] as const;
export type FormatoValorMeta = (typeof FORMATOS_VALOR)[number];

export type StatusMeta = "NAO_INICIADA" | "EM_ANDAMENTO" | "ATINGIDA" | "ATRASADA";

// Metas em que um valor MENOR é melhor (ex.: inadimplência) — inverte a
// fórmula do percentual atingido (ver GetMetasDashboardService).
export const TIPOS_META_REDUCAO: TipoMeta[] = ["INADIMPLENCIA"];
