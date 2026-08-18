import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { api, registrarExpiracaoDeSessao } from "../services/api";
import { ErroDeUsuario } from "../utils/ErroDeUsuario";
import { AuthContext } from "./authContextData";
import type { UsuarioProfessor } from "./authContextData";

const CHAVE_USUARIO = "@portalProfessor:usuario";
const CHAVE_TOKEN = "@portalProfessor:token";

// DONO entra porque herda ADMIN em todo o resto do sistema; barrá-lo aqui
// deixaria o dono da academia de fora do portal que ele usa para dar aula.
// SUPERADMIN saiu da lista: o perfil não existe mais, e o backend recusa esse
// login antes de chegar aqui.
const PERFIS_PERMITIDOS = ["PROFESSOR", "ADMIN", "DONO"];

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
  const [usuario, setUsuario] = useState<UsuarioProfessor | null>(() => lerStorage(CHAVE_USUARIO));

  const [token, setToken] = useState<string | null>(() => {
    const tokenStorage = localStorage.getItem(CHAVE_TOKEN);
    if (tokenStorage) {
      api.defaults.headers.common.Authorization = `Bearer ${tokenStorage}`;
    }
    return tokenStorage;
  });

  async function login(email: string, senha: string) {
    // reaproveita o MESMO login do sgcl-web (POST /auth/login) — o
    // professor já é um Usuario, não existe credencial nova pra ele.
    const response = await api.post("/auth/login", { email, senha });
    const { usuario: usuarioLogado, token: tokenRecebido } = response.data;

    if (!PERFIS_PERMITIDOS.includes(usuarioLogado.perfil)) {
      throw new ErroDeUsuario(
        "Este acesso é exclusivo para professores. Use o sistema completo (sgcl-web) com seu login."
      );
    }

    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioLogado));
    localStorage.setItem(CHAVE_TOKEN, tokenRecebido);

    api.defaults.headers.common.Authorization = `Bearer ${tokenRecebido}`;

    setUsuario(usuarioLogado);
    setToken(tokenRecebido);
  }

  function logout() {
    localStorage.removeItem(CHAVE_USUARIO);
    localStorage.removeItem(CHAVE_TOKEN);

    delete api.defaults.headers.common.Authorization;

    setUsuario(null);
    setToken(null);
  }

  // O interceptor da `api` não conhece a sessão; é aqui que ele passa a saber
  // o que fazer quando o backend recusa o token. Sem isso, uma sessão expirada
  // deixava o app "logado" com todas as telas quebradas e nenhum caminho de
  // volta ao login a não ser limpar o storage à mão.
  useEffect(() => {
    registrarExpiracaoDeSessao(logout);
  });

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
