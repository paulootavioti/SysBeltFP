import { useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { AuthContext } from "./authContextData";
import type { Usuario } from "./authContextData";

type AuthProviderProps = {
  children: ReactNode;
};

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

    return usuario as Usuario;
  }

  function logout() {
    localStorage.removeItem("@sgcl:usuario");
    localStorage.removeItem("@sgcl:token");

    delete api.defaults.headers.common.Authorization;

    setUsuario(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}