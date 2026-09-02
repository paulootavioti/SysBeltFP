export type EstagioLead = "NOVO" | "CONTATADO" | "QUALIFICADO" | "EXPERIMENTAL_AGENDADA" | "COMPARECEU" | "NEGOCIACAO" | "MATRICULADO" | "PERDIDO";

export const ESTAGIO_LEAD_LABEL: Record<EstagioLead, string> = {
  NOVO: "Novo",
  CONTATADO: "Contatado",
  QUALIFICADO: "Qualificado",
  EXPERIMENTAL_AGENDADA: "Experimental agendada",
  COMPARECEU: "Compareceu",
  NEGOCIACAO: "Negociação",
  MATRICULADO: "Matriculado",
  PERDIDO: "Perdido",
};

export interface Lead {
  id: number;
  nome: string;
  telefoneE164: string;
  email: string | null;
  estagio: EstagioLead;
  situacao: "NUNCA_TREINOU" | "TREINA_EM_OUTRA" | "EX_ALUNO" | "ALUNO_ATUAL";
  proximaAcaoEm: string | null;
  canal: { id: number; nome: string };
  modalidadeInteresse: { id: number; nome: string } | null;
  responsavelUsuario: { id: number; nome: string } | null;
  criadoEm: string;
}

export interface PaginaLeads { itens: Lead[]; pagina: number; limite: number; total: number; totalPaginas: number }
