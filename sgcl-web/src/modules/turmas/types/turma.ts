export interface ProfessorResumo {
  id: number;
  nome: string;
  apelido?: string | null;
}

export interface ArenaResumo {
  id: number;
  nome: string;
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
  arenaId?: number | null;
  arena?: ArenaResumo | null;
  ativo: boolean;
  limiteAlunos?: number | null;
  curriculoId?: number | null;
  modalidadeId?: number | null;
  modalidade?: { id: number; nome: string } | null;
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
  frequenciaMes: number;
  frequenciaAno: number;
}

export interface TurmaDetalhada extends Turma {
  alunos: AlunoDaTurma[];
  frequenciaMediaAno: number;
}