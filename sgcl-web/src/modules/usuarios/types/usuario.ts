export type PerfilUsuario = "ADMIN" | "PROFESSOR" | "RECEPCAO";
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
}