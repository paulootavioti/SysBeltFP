import { useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { AuthContext } from "./authContextData";
import type { Usuario, UnidadeVisualizada } from "./authContextData";

type AuthProviderProps = {
  children: ReactNode;
};

function aplicarHeaderUnidade(unidade: UnidadeVisualizada) {
  if (unidade) {
    api.defaults.headers.common["X-Unidade-Id"] = String(unidade.id);
  } else {
    delete api.defaults.headers.common["X-Unidade-Id"];
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const usuarioStorage = localStorage.getItem("@sgcl:usuario");

    if (usuarioStorage) {
      return JSON.parse(usuarioStorage);
    }

    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    const tokenStorage = localStorage.getItem("@sgcl:token");

    if (tokenStorage) {
      api.defaults.headers.common.Authorization = `Bearer ${tokenStorage}`;
      return tokenStorage;
    }

    return null;
  });

  const [unidadeVisualizada, setUnidadeVisualizada] = useState<UnidadeVisualizada>(() => {
    const storage = localStorage.getItem("@sgcl:unidadeVisualizada");
    const unidade = storage ? JSON.parse(storage) : null;
    aplicarHeaderUnidade(unidade);
    return unidade;
  });

  async function login(email: string, senha: string) {
    const response = await api.post("/auth/login", {
      email,
      senha,
    });

    const { usuario, token } = response.data;

    localStorage.setItem("@sgcl:usuario", JSON.stringify(usuario));
    localStorage.setItem("@sgcl:token", token);

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    setUsuario(usuario);
    setToken(token);
    definirUnidadeVisualizada(null);

    return usuario as Usuario;
  }

  function logout() {
    localStorage.removeItem("@sgcl:usuario");
    localStorage.removeItem("@sgcl:token");

    delete api.defaults.headers.common.Authorization;

    setUsuario(null);
    setToken(null);
    definirUnidadeVisualizada(null);
  }

  function definirUnidadeVisualizada(unidade: UnidadeVisualizada) {
    if (unidade) {
      localStorage.setItem("@sgcl:unidadeVisualizada", JSON.stringify(unidade));
    } else {
      localStorage.removeItem("@sgcl:unidadeVisualizada");
    }

    aplicarHeaderUnidade(unidade);
    setUnidadeVisualizada(unidade);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        unidadeVisualizada,
        definirUnidadeVisualizada,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
