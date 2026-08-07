import { useCallback, useEffect, useState } from "react";

import type { Modalidade } from "../types/modalidade";
import { ModalidadeService } from "../services/ModalidadeService";

export function useModalidades(apenasAtivas = false) {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregarModalidades = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");
      setModalidades(await ModalidadeService.listar(apenasAtivas));
    } catch {
      setErro("Erro ao carregar modalidades.");
    } finally {
      setLoading(false);
    }
  }, [apenasAtivas]);

  useEffect(() => {
    carregarModalidades();
  }, [carregarModalidades]);

  return { modalidades, setModalidades, loading, erro, setErro, carregarModalidades };
}
