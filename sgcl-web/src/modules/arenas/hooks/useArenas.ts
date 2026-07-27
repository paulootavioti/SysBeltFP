import { useEffect, useState } from "react";
import type { Arena } from "../types/arena";
import { ArenaService } from "../services/ArenaService";

export function useArenas() {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarArenas() {
    try {
      setLoading(true);
      setErro("");
      const data = await ArenaService.listar();
      setArenas(data);
    } catch {
      setErro("Erro ao carregar arenas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarArenas();
  }, []);

  return {
    arenas,
    setArenas,
    loading,
    erro,
    setErro,
    carregarArenas,
  };
}
