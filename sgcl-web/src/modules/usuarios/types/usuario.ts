export type PerfilUsuario = "ADMIN" | "PROFESSOR" | "RECEPCAO";
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  createdAt: string;
}