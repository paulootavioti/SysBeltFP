import { createContext } from "react";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  unidadeId: number | null;
  unidadeNome: string | null;
};

export type UnidadeVisualizada = {
  id: number;
  nome: string;
} | null;

export type AuthContextData = {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
  // só tem efeito quando usuario.perfil === "SUPERADMIN" — null significa
  // "Todas as unidades" (comportamento padrão, sem filtro).
  unidadeVisualizada: UnidadeVisualizada;
  definirUnidadeVisualizada: (unidade: UnidadeVisualizada) => void;
};

export const AuthContext = createContext({} as AuthContextData);
