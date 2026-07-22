import { useEffect, useState } from "react";
import type { MensalidadeComAluno } from "../types";
import { MensalidadeService } from "../services/MensalidadeService";

export function useMensalidades() {
  const [mensalidades, setMensalidades] = useState<MensalidadeComAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarMensalidades() {
    try {
      setLoading(true);
      setErro("");
      const data = await MensalidadeService.listar();
      setMensalidades(data);
    } catch {
      setErro("Erro ao carregar mensalidades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarMensalidades();
  }, []);

  return {
    mensalidades,
    setMensalidades,
    loading,
    erro,
    setErro,
    carregarMensalidades,
  };
}
