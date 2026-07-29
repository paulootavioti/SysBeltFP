import { useEffect, useState } from "react";
import type { ModeloContrato } from "../types";
import { ModeloContratoService } from "../services/ModeloContratoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useModelosContrato() {
  const [modelos, setModelos] = useState<ModeloContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarModelos() {
    try {
      setLoading(true);
      setErro("");
      const data = await ModeloContratoService.listar();
      setModelos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar modelos de contrato."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarModelos();
  }, []);

  return {
    modelos,
    setModelos,
    loading,
    erro,
    setErro,
    carregarModelos,
  };
}
