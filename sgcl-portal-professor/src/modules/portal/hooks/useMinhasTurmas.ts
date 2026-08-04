import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../contexts/useAuth";
import { AcademicoService } from "../services/AcademicoService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { TurmaResumo } from "../types-academico";

export function useMinhasTurmas() {
  const { usuario } = useAuth();

  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario) return;

    try {
      setCarregando(true);
      setErro("");
      const todas = await AcademicoService.listarTurmas();
      setTurmas(todas.filter((turma) => turma.professorId === usuario.id));
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar suas turmas."));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { turmas, carregando, erro, carregarTurmas: carregar };
}
