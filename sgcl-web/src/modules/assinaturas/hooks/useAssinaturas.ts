import { useEffect, useState } from "react";
import type { Assinatura } from "../types";
import { AssinaturaService } from "../services/AssinaturaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useAssinaturas() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarAssinaturas() {
    try {
      setLoading(true);
      setErro("");
      const data = await AssinaturaService.listar();
      setAssinaturas(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar assinaturas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAssinaturas();
  }, []);

  return {
    assinaturas,
    setAssinaturas,
    loading,
    erro,
    setErro,
    carregarAssinaturas,
  };
}
