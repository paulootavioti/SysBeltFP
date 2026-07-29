import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/useAuth";

// Favoritos do menu lateral, por usuário (evita que os atalhos de uma
// pessoa apareçam pra outra num computador compartilhado, ex.: recepção).
// Guardado só no navegador — não é um dado de negócio, não precisa de
// backend nem sincroniza entre dispositivos.
function chaveStorage(usuarioId: number): string {
  return `@sgcl:menuFavoritos:${usuarioId}`;
}

export function useFavoritosMenu() {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    if (!usuario) {
      setFavoritos([]);
      return;
    }

    try {
      const armazenado = localStorage.getItem(chaveStorage(usuario.id));
      setFavoritos(armazenado ? JSON.parse(armazenado) : []);
    } catch {
      setFavoritos([]);
    }
  }, [usuario]);

  const alternarFavorito = useCallback(
    (to: string) => {
      if (!usuario) return;

      setFavoritos((atual) => {
        const proximo = atual.includes(to) ? atual.filter((f) => f !== to) : [...atual, to];
        localStorage.setItem(chaveStorage(usuario.id), JSON.stringify(proximo));
        return proximo;
      });
    },
    [usuario]
  );

  const ehFavorito = useCallback((to: string) => favoritos.includes(to), [favoritos]);

  return { favoritos, ehFavorito, alternarFavorito };
}
