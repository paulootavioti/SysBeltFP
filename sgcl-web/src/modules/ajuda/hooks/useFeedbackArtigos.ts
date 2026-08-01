import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import type { Feedback } from "../types";

// Feedback "útil/não útil" por artigo, guardado só no navegador — não é
// um dado de negócio que precise de backend ainda (mesmo raciocínio de
// useFavoritosMenu). Por usuário, pra não misturar o feedback de pessoas
// diferentes num computador compartilhado.
function chaveStorage(usuarioId: number): string {
  return `@sgcl:ajudaFeedback:${usuarioId}`;
}

export function useFeedbackArtigos() {
  const { usuario } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});

  useEffect(() => {
    if (!usuario) {
      setFeedbacks({});
      return;
    }

    try {
      const armazenado = localStorage.getItem(chaveStorage(usuario.id));
      setFeedbacks(armazenado ? JSON.parse(armazenado) : {});
    } catch {
      setFeedbacks({});
    }
  }, [usuario]);

  const registrarFeedback = useCallback(
    (artigoId: string, feedback: Feedback) => {
      if (!usuario) return;

      setFeedbacks((atual) => {
        const proximo = { ...atual, [artigoId]: feedback };
        localStorage.setItem(chaveStorage(usuario.id), JSON.stringify(proximo));
        return proximo;
      });
    },
    [usuario]
  );

  return { feedbacks, registrarFeedback };
}
