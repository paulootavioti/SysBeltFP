import { useEffect, useState } from "react";
import type { MetaDashboard } from "../types";
import { MetaService } from "../services/MetaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useMetas() {
  const [metas, setMetas] = useState<MetaDashboard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarMetas() {
    try {
      setCarregando(true);
      setErro("");
      const data = await MetaService.listar();
      setMetas(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar as metas."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMetas();
  }, []);

  return {
    metas,
    setMetas,
    carregando,
    erro,
    setErro,
    carregarMetas,
  };
}
