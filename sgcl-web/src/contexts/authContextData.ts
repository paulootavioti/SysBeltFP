import { createContext } from "react";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
};

export type AuthContextData = {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
};

export const AuthContext = createContext({} as AuthContextData);
