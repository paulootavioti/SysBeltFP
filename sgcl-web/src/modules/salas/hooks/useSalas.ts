import { useEffect, useState } from "react";
import type { Sala } from "../types/sala";
import { SalaService } from "../services/SalaService";

export function useSalas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarSalas() {
    try {
      setLoading(true);
      setErro("");
      const data = await SalaService.listar();
      setSalas(data);
    } catch {
      setErro("Erro ao carregar salas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarSalas();
  }, []);

  return {
    salas,
    setSalas,
    loading,
    erro,
    setErro,
    carregarSalas,
  };
}
