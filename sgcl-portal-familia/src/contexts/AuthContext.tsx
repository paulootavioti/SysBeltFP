import { useState } from "react";
import type { ReactNode } from "react";

import { api } from "../services/api";
import { AuthContext } from "./authContextData";
import type { AlunoResumo, UsuarioFamilia } from "./authContextData";

const CHAVE_USUARIO = "@portalFamilia:usuario";
const CHAVE_TOKEN = "@portalFamilia:token";
const CHAVE_ALUNOS = "@portalFamilia:alunos";
const CHAVE_ALUNO_SELECIONADO = "@portalFamilia:alunoSelecionadoId";

interface AuthProviderProps {
  children: ReactNode;
}

function lerStorage<T>(chave: string): T | null {
  const valor = localStorage.getItem(chave);
  if (!valor) return null;
  try {
    return JSON.parse(valor) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioFamilia | null>(() => lerStorage(CHAVE_USUARIO));
  const [alunos, setAlunos] = useState<AlunoResumo[]>(() => lerStorage(CHAVE_ALUNOS) ?? []);

  const [token, setToken] = useState<string | null>(() => {
    const tokenStorage = localStorage.getItem(CHAVE_TOKEN);
    if (tokenStorage) {
      api.defaults.headers.common.Authorization = `Bearer ${tokenStorage}`;
    }
    return tokenStorage;
  });

  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<number | null>(() => {
    const salvo = localStorage.getItem(CHAVE_ALUNO_SELECIONADO);
    if (salvo) return Number(salvo);
    const alunosStorage = lerStorage<AlunoResumo[]>(CHAVE_ALUNOS);
    return alunosStorage?.[0]?.id ?? null;
  });

  async function login(email: string, senha: string) {
    const response = await api.post("/portal-familia/login", { email, senha });
    const { usuario: usuarioLogado, alunos: alunosVinculados, token: tokenRecebido } = response.data;

    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioLogado));
    localStorage.setItem(CHAVE_TOKEN, tokenRecebido);
    localStorage.setItem(CHAVE_ALUNOS, JSON.stringify(alunosVinculados));

    const primeiroAluno = alunosVinculados[0]?.id ?? null;
    if (primeiroAluno) {
      localStorage.setItem(CHAVE_ALUNO_SELECIONADO, String(primeiroAluno));
    }

    api.defaults.headers.common.Authorization = `Bearer ${tokenRecebido}`;

    setUsuario(usuarioLogado);
    setAlunos(alunosVinculados);
    setAlunoSelecionadoId(primeiroAluno);
    setToken(tokenRecebido);
  }

  function logout() {
    localStorage.removeItem(CHAVE_USUARIO);
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_ALUNOS);
    localStorage.removeItem(CHAVE_ALUNO_SELECIONADO);

    delete api.defaults.headers.common.Authorization;

    setUsuario(null);
    setAlunos([]);
    setAlunoSelecionadoId(null);
    setToken(null);
  }

  function selecionarAluno(id: number) {
    localStorage.setItem(CHAVE_ALUNO_SELECIONADO, String(id));
    setAlunoSelecionadoId(id);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        alunos,
        alunoSelecionadoId,
        selecionarAluno,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
