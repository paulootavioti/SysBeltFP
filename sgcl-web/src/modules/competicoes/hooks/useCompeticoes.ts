import { useEffect, useState } from "react";
import type { Competicao } from "../types/competicao";
import { CompeticaoService } from "../services/CompeticaoService";

export function useCompeticoes() {
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarCompeticoes() {
    try {
      setLoading(true);
      setErro("");
      const data = await CompeticaoService.listar();
      setCompeticoes(data);
    } catch {
      setErro("Erro ao carregar competições.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCompeticoes();
  }, []);

  return {
    competicoes,
    setCompeticoes,
    loading,
    erro,
    setErro,
    carregarCompeticoes,
  };
}