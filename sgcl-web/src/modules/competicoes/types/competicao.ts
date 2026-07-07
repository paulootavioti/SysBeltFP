export interface Competicao {
  id: number;
  nome: string;
  data: string;
  local: string;
}

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