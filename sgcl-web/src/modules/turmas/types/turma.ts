export interface Turma {
  id: number;
  nome: string;
  faixaEtaria: string;
  diasSemana: string;
  horarioInicio: string;
  horarioFim: string;
  professor: string;
  ativo: boolean;
  limiteAlunos?: number | null;
  curriculoId?: number | null;
  curriculo?: {
    id: number;
    nome: string;
  } | null;
  _count?: {
    alunos: number;
  };
  createdAt: string;
}

export interface AlunoDaTurma {
  id: number;
  nome: string;
  faixa: string;
  ativo: boolean;
}

export interface TurmaDetalhada extends Turma {
  alunos: AlunoDaTurma[];
}