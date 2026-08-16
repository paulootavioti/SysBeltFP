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
  // Unidade escolhida entre os vínculos operacionais do usuário.
  unidadeVisualizada: UnidadeVisualizada;
  definirUnidadeVisualizada: (unidade: UnidadeVisualizada) => void;
};

export const AuthContext = createContext({} as AuthContextData);
