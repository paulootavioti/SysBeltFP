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
  login: (email: string, senha: string, desafio?: string, codigo?: string) => Promise<{ requerDoisFatores: true; desafio: string } | void>;
  logout: () => void;
}

export const AuthContext = createContext({} as AuthContextData);
