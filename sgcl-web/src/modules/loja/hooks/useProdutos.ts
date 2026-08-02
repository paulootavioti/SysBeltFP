import { useEffect, useState } from "react";

import type { Produto } from "../types";
import { LojaService, type FiltrosProdutos } from "../services/LojaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useProdutos(filtros: FiltrosProdutos) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro("");
      const data = await LojaService.listarProdutos(filtros);
      setProdutos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar produtos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.busca, filtros.categoria, filtros.ativo]);

  return { produtos, loading, erro, setErro, carregarProdutos };
}
