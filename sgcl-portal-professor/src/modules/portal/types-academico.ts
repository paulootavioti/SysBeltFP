// Tipos das telas de "Preparação e análise" (Turmas, Planejamento,
// Prontuários, Graduações) — todas consomem os MESMOS endpoints já usados
// pelo sgcl-web (mesmo backend, mesmo token), só que direto daqui dentro,
// sem sair do Portal do Professor.

export interface TurmaResumo {
  id: number;
  nome: string;
  faixaEtaria: string;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  professorId: number | null;
  curriculoId: number | null;
  curriculo?: { id: number; nome: string } | null;
  ativo: boolean;
  _count?: { alunos: number };
}

export interface AlunoDaTurma {
  id: number;
  nome: string;
  faixa: string;
  ativo: boolean;
}

export interface TurmaDetalhada extends TurmaResumo {
  alunos: AlunoDaTurma[];
}

export interface AlunoDoProfessor {
  id: number;
  nome: string;
  faixa: string;
  ativo: boolean;
  turmaId: number;
  turmaNome: string;
}

export interface TecnicaCurriculo {
  id: number;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  obrigatoria: boolean;
  ordem: number;
}

export interface AulaCurriculo {
  id: number;
  titulo: string;
  objetivo?: string | null;
  descricao?: string | null;
  duracaoMinutos?: number | null;
  jogosSugeridos?: string | null;
  ordem: number;
  tecnicas: TecnicaCurriculo[];
}

export interface ModuloCurriculo {
  id: number;
  nome: string;
  descricao?: string | null;
  faixa?: string | null;
  ordem: number;
  aulas: AulaCurriculo[];
}

export interface Curriculo {
  id: number;
  nome: string;
  descricao?: string | null;
  modalidade: string;
  publico: string;
  modulos: ModuloCurriculo[];
}

export interface AlunoElegivel {
  alunoId: number;
  nome: string;
  faixa: string;
  presencas: number;
  proximaFaixa?: string | null;
  aptoGraduacao?: boolean;
}

export interface ProntuarioProfessor {
  aluno: {
    id: number;
    nome: string;
    apelido: string | null;
    dataNascimento: string;
    ativo: boolean;
  };
  resumo: {
    totalAulas: number;
    totalPresencas: number;
    frequencia: number;
    frequenciaMes: number;
    frequenciaAno: number;
    faixa: string;
    grau: number;
    proximoGrauEm: number;
  };
  comportamento: {
    respeito: number;
    valentia: number;
    esforco: number;
    atencao: number;
    disciplina: number;
  };
  comportamentoRegistros: Array<{
    id: number;
    data: string;
    respeito: boolean;
    valentia: boolean;
    esforco: boolean;
    atencao: boolean;
    disciplina: boolean;
    observacao: string | null;
  }>;
  responsaveis: Array<{ id: number; nome: string; parentesco: string }>;
  turma: { id: number; nome: string } | null;
  graduacoes: Array<{ id: number; faixa: string; data: string; status: string }>;
}
