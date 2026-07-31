export interface Competicao {
  id: number;
  nome: string;
  data: string;
  local: string;
}

export const RESULTADOS_COMPETICAO = [
  "Ouro",
  "Prata",
  "Bronze",
  "Não classificado",
  "Desclassificado",
] as const;

export type ResultadoCompeticao = (typeof RESULTADOS_COMPETICAO)[number];

export interface Atleta {
  id: number;
  competicaoId: number;
  alunoId: number;
  resultado: string | null;
  aluno: {
    id: number;
    nome: string;
    faixa: string;
  };
}