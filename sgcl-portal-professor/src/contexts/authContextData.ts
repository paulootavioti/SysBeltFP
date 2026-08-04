import { createContext } from "react";

export interface UsuarioProfessor {
  id: number;
  nome: string;
  apelido: string | null;
  email: string;
  perfil: string;
  unidadeId: number | null;
  unidadeNome: string | null;
}

export interface AuthContextData {
  usuario: UsuarioProfessor | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext({} as AuthContextData);
