import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../contexts/useAuth";
import { TurmaService } from "../../turmas/services/TurmaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import type { Turma } from "../../turmas/types/turma";

export function useMinhasTurmas() {
  const { usuario } = useAuth();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      setErro("");
      const todas = await TurmaService.listar();
      setTurmas(todas.filter((turma) => turma.professorId === usuario.id));
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar suas turmas."));
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { turmas, loading, erro, setErro, carregarTurmas: carregar };
}
