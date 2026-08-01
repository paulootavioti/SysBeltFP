import { createContext } from "react";

export type TipoFamilia = "RESPONSAVEL" | "ALUNO";

export interface UsuarioFamilia {
  tipo: TipoFamilia;
  nome: string;
  email: string;
}

export interface AlunoResumo {
  id: number;
  nome: string;
  apelido: string | null;
  fotoUrl: string | null;
  iniciais: string;
}

export interface AuthContextData {
  usuario: UsuarioFamilia | null;
  token: string | null;
  alunos: AlunoResumo[];
  alunoSelecionadoId: number | null;
  selecionarAluno: (id: number) => void;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext({} as AuthContextData);
