export type PerfilUsuario = "ADMIN" | "PROFESSOR" | "RECEPCAO" | "SUPERADMIN";

export interface ProfessorOpcao {
  id: number;
  nome: string;
  apelido?: string | null;
}

export interface Usuario {
  id: number;
  nome: string;
  apelido?: string | null;
  email: string;
  perfil: PerfilUsuario;
  nivelGraduacao?: string | null;
  outrasGraduacoes?: string | null;
  fotoUrl?: string | null;
  ativo: boolean;
  createdAt: string;
  unidadesVinculadas?: { unidade: { id: number; nome: string } }[];
}