import { useState } from "react";
import type { ReactNode } from "react";

import { api } from "../services/api";
import { AuthContext } from "./authContextData";
import type { UsuarioProfessor } from "./authContextData";

const CHAVE_USUARIO = "@portalProfessor:usuario";
const CHAVE_TOKEN = "@portalProfessor:token";

const PERFIS_PERMITIDOS = ["PROFESSOR", "ADMIN", "SUPERADMIN"];

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
      throw new Error(
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

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
