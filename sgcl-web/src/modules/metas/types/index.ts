export type TipoMeta =
  | "RECEITA"
  | "NOVAS_MATRICULAS"
  | "ALUNOS_ATIVOS"
  | "FREQUENCIA"
  | "INADIMPLENCIA"
  | "RETENCAO";

export type StatusMeta = "NAO_INICIADA" | "EM_ANDAMENTO" | "ATINGIDA" | "ATRASADA";

export interface MetaDashboard {
  id: number;
  nome: string;
  tipo: TipoMeta;
  valorAtual: number;
  valorMeta: number;
  percentualAtingido: number;
  unidade: "MOEDA" | "QUANTIDADE" | "PERCENTUAL";
  status: StatusMeta;
  dataLimite: string;
}

// Metas em que um valor MENOR é melhor (ex.: inadimplência) — inverte a
// leitura de "superado"/progresso na UI.
export const TIPOS_META_REDUCAO: TipoMeta[] = ["INADIMPLENCIA"];
