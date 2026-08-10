import { useEffect, useState } from "react";

import type { MinhaAssinatura } from "../types";
import { PlataformaService } from "../services/PlataformaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useMinhaAssinatura() {
  const [assinatura, setAssinatura] = useState<MinhaAssinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");
      setAssinatura(await PlataformaService.minhaAssinatura());
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar a assinatura."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  return { assinatura, loading, erro, carregar };
}
