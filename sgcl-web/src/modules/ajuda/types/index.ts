export type CategoriaAjuda =
  | "Alunos"
  | "Turmas e Aulas"
  | "Planejamento Pedagógico"
  | "Financeiro"
  | "Graduações";

export interface ArtigoAjuda {
  id: string;
  categoria: CategoriaAjuda;
  titulo: string;
  resumo: string;
  conteudo: string[];
}

export type Feedback = "util" | "nao-util";
