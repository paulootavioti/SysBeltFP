export interface TurmaResumo {
  id: number;
  nome: string;
  professor: string;
}

export interface TecnicaAulaCurriculo {
  id: number;
  nome: string;
  categoria?: string | null;
  descricao?: string | null;
  obrigatoria: boolean;
  ordem: number;
}

export interface AulaCurriculoResumo {
  id: number;
  titulo: string;
  objetivo?: string | null;
  descricao?: string | null;
  duracaoMinutos?: number | null;
  jogosSugeridos?: string | null;
  tecnicas: TecnicaAulaCurriculo[];
}

export interface AulaAluno {
  id: number;
  aulaId: number;
  alunoId: number;

  presente: boolean;

  respeito: boolean;
  valentia: boolean;
  esforco: boolean;
  atencao: boolean;
  disciplina: boolean;

  observacao?: string | null;

  aluno: {
    id: number;
    nome: string;
    apelido?: string | null;
    faixa: string;
    grau: number;
    dataNascimento: string;
    responsaveis?: {
      id: number;
      nome: string;
      apelido?: string | null;
      telefone?: string | null;
      whatsapp?: string | null;
      parentesco: string;
      recebeComunicados: boolean;
    }[];
  };
}

export interface Aula {
  id: number;
  data: string;
  professor?: string | null;
  observacoes?: string | null;
  status: "ABERTA" | "FINALIZADA";

  turma?: TurmaResumo | null;
  aulaCurriculo?: AulaCurriculoResumo | null;

  jogosRealizados: string[];
  tecnicasRealizadas: TecnicaAulaCurriculo[];

  alunos: AulaAluno[];
}
export interface AulaProgramada {
  id: number;
  turmaId: number;
  turma: TurmaResumo;
  aulaCurriculoId?: number | null;
  aulaCurriculo?: AulaCurriculoResumo | null;
  data: string;
  observacoes?: string | null;
  status: "PENDENTE" | "INICIADA" | "CANCELADA";
  aulaId?: number | null;
}

export interface ItemGradeSemanal {
  id: number;
  turmaId: number;
  turmaNome: string;
  professorApelido?: string | null;
  data: string;
  diaSemana: number;
  horarioInicio: string;
  horarioFim: string;
  status: "AGENDADA" | "CONCLUIDA" | "NAO_REALIZADA";
}

export type PeriodoContagem = "SEMANAL" | "MENSAL" | "SEMESTRAL" | "ANUAL";

export interface ResumoTurmaAulas {
  turmaId: number;
  turmaNome: string;
  quantidade: number;
}