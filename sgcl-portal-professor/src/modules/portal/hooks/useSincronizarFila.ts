import { useCallback, useEffect, useState } from "react";

import { PortalProfessorService } from "../services/PortalProfessorService";
import { enfileirar, lerFila, type AcaoPendente } from "../utils/filaOffline";
import { ehErroDeConexao, sincronizarFila } from "../utils/sincronizarFila";

async function executarAcao(acao: AcaoPendente) {
  switch (acao.tipo) {
    case "presenca":
      return PortalProfessorService.marcarPresenca(
        acao.aulaId,
        acao.payload.alunoId as number,
        acao.payload.presente as boolean
      );
    case "tecnica":
      return PortalProfessorService.marcarTecnica(
        acao.aulaId,
        acao.payload.tecnicaId as number,
        acao.payload.executada as boolean
      );
    case "observacao":
      return PortalProfessorService.registrarObservacao(acao.aulaId, acao.payload.texto as string);
  }
}

export function useSincronizarFila() {
  const [pendentes, setPendentes] = useState(() => lerFila().length);

  const sincronizar = useCallback(async () => {
    setPendentes(await sincronizarFila(executarAcao));
  }, []);

  useEffect(() => {
    sincronizar();
    window.addEventListener("online", sincronizar);
    return () => window.removeEventListener("online", sincronizar);
  }, [sincronizar]);

  function enfileirarSeOffline(acao: Omit<AcaoPendente, "id" | "criadoEm">, error: unknown) {
    if (!ehErroDeConexao(error)) return false;
    enfileirar(acao);
    setPendentes((atual) => atual + 1);
    return true;
  }

  return { pendentes, enfileirarSeOffline };
}
