import { useEffect, useState } from "react";
import type { Graduacao } from "../types";
import { GraduacaoService } from "../services/GraduacaoService";

export function useGraduacoes() {
  const [graduacoes, setGraduacoes] = useState<Graduacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarGraduacoes() {
    try {
      setLoading(true);
      setErro("");
      const data = await GraduacaoService.listar();
      setGraduacoes(data);
    } catch (error) {
      setErro("Erro ao carregar graduações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarGraduacoes();
  }, []);

  return {
    graduacoes,
    setGraduacoes,
    loading,
    erro,
    setErro,
    carregarGraduacoes,
  };
}
