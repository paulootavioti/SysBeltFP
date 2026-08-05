export interface PlanoResumo {
  moduloNome: string;
  tituloAula: string;
  totalTecnicas: number;
}

export type StatusAulaHoje = "AGENDADA" | "EM_ANDAMENTO" | "CONCLUIDA";

export interface AulaHojeItem {
  aulaProgramadaId: number;
  aulaId: number | null;
  turmaId: number;
  turmaNome: string;
  horarioInicio: string;
  horarioFim: string;
  totalAlunos: number;
  minutosParaComeco: number;
  plano: PlanoResumo | null;
  status: StatusAulaHoje;
}

export interface ProximaSemanaItem {
  aulaProgramadaId: number;
  turmaId: number;
  turmaNome: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
}

export interface AulasHojeResponse {
  proximaAula: AulaHojeItem | null;
  outrasHoje: AulaHojeItem[];
  proximaSemana: ProximaSemanaItem | null;
}

export interface TecnicaCurriculo {
  id: number;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  obrigatoria: boolean;
  ordem: number;
}

export interface AulaCurriculoDetalhe {
  id: number;
  titulo: string;
  objetivo: string | null;
  descricao: string | null;
  jogosSugeridos: string | null;
  tecnicas: TecnicaCurriculo[];
}

export interface ResponsavelResumo {
  id: number;
  nome: string;
  apelido: string | null;
  telefone: string | null;
  whatsapp: string | null;
  parentesco: string;
}

export interface AlunoNaAula {
  id: number;
  nome: string;
  apelido: string | null;
  faixa: string;
  grau: number;
  responsaveis: ResponsavelResumo[];
}

export interface AulaAlunoDetalhe {
  id: number;
  aulaId: number;
  alunoId: number;
  presente: boolean;
  observacao: string | null;
  aluno: AlunoNaAula;
  frequenciaMes: number;
}

export interface TurmaDetalhe {
  id: number;
  nome: string;
  faixaEtaria: string;
  horarioInicio: string;
  horarioFim: string;
  professorId: number | null;
}

export interface NotaAula {
  id: number;
  aulaId: number;
  alunoId: number;
  tag: string | null;
  texto: string | null;
  criadoPorId: number;
  createdAt: string;
}

export interface AulaDetalhe {
  id: number;
  data: string;
  observacoes: string | null;
  status: "ABERTA" | "FINALIZADA";
  turma: TurmaDetalhe | null;
  aulaCurriculo: AulaCurriculoDetalhe | null;
  tecnicasRealizadas: TecnicaCurriculo[];
  alunos: AulaAlunoDetalhe[];
  notas: NotaAula[];
}

export interface FotoTreino {
  id: number;
  aulaId: number;
  url: string;
  legenda: string;
  publicadaEm: string;
  visivelNaLanding: boolean;
  publicadaPor?: { id: number; nome: string } | null;
}

export interface ResumoAula {
  aulaId: number;
  turmaNome: string | null;
  duracaoMinutos: number;
  presenca: { presentes: number; total: number; percentual: number };
  tecnicas: { executadas: number; planejadas: number };
  observacaoRegistrada: boolean;
  alunosComNota: number;
  fotos: { id: number; visivelNaLanding: boolean }[];
}

export const TAGS_NOTA_RAPIDA = ["Evoluiu bem", "Precisa atenção", "Ótima atitude", "Faltou foco"] as const;
