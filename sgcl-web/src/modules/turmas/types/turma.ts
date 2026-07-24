export interface ProfessorResumo {
  id: number;
  nome: string;
  apelido?: string | null;
}

export interface Turma {
  id: number;
  nome: string;
  faixaEtaria: string;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  professorId?: number | null;
  professor?: ProfessorResumo | null;
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