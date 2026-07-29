import { useEffect, useState } from "react";
import type { Contrato } from "../types";
import { ContratoService } from "../services/ContratoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarContratos() {
    try {
      setLoading(true);
      setErro("");
      const data = await ContratoService.listar();
      setContratos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar contratos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarContratos();
  }, []);

  return {
    contratos,
    setContratos,
    loading,
    erro,
    setErro,
    carregarContratos,
  };
}
