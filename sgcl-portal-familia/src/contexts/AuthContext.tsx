import { useState } from "react";
import type { ReactNode } from "react";

import { api } from "../services/api";
import {
  escolherAlunoSelecionado,
  gravarAlunoSelecionado,
  gravarSessao,
  lerSessao,
  limparSessao,
} from "../utils/sessaoFamilia";
import { AuthContext } from "./authContextData";
import type { AlunoResumo, UsuarioFamilia } from "./authContextData";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [sessaoInicial] = useState(lerSessao);

  const [usuario, setUsuario] = useState<UsuarioFamilia | null>(sessaoInicial.usuario);
  const [alunos, setAlunos] = useState<AlunoResumo[]>(sessaoInicial.alunos);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<number | null>(
    sessaoInicial.alunoSelecionadoId
  );

  const [token, setToken] = useState<string | null>(() => {
    if (sessaoInicial.token) {
      api.defaults.headers.common.Authorization = `Bearer ${sessaoInicial.token}`;
    }
    return sessaoInicial.token;
  });

  async function login(email: string, senha: string) {
    const response = await api.post("/portal-familia/login", { email, senha });
    const { usuario: usuarioLogado, alunos: alunosVinculados, token: tokenRecebido } = response.data;

    // Um login novo não herda a seleção anterior: passar `null` faz a escolha
    // recair sobre o primeiro aluno da lista recebida agora, ou sobre nenhum.
    const selecionado = escolherAlunoSelecionado(null, alunosVinculados);

    gravarSessao({
      usuario: usuarioLogado,
      token: tokenRecebido,
      alunos: alunosVinculados,
      alunoSelecionadoId: selecionado,
    });

    api.defaults.headers.common.Authorization = `Bearer ${tokenRecebido}`;

    setUsuario(usuarioLogado);
    setAlunos(alunosVinculados);
    setAlunoSelecionadoId(selecionado);
    setToken(tokenRecebido);
  }

  function logout() {
    limparSessao();

    delete api.defaults.headers.common.Authorization;

    setUsuario(null);
    setAlunos([]);
    setAlunoSelecionadoId(null);
    setToken(null);
  }

  function selecionarAluno(id: number) {
    gravarAlunoSelecionado(id);
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
