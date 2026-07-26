import { useEffect, useState } from "react";
import type { Unidade } from "../types/unidade";
import { UnidadeService } from "../services/UnidadeService";

export function useUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarUnidades() {
    try {
      setLoading(true);
      setErro("");
      const data = await UnidadeService.listar();
      setUnidades(data);
    } catch {
      setErro("Erro ao carregar unidades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUnidades();
  }, []);

  return {
    unidades,
    setUnidades,
    loading,
    erro,
    setErro,
    carregarUnidades,
  };
}
