import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";

import { PortalProfessorService } from "../services/PortalProfessorService";
import { lerFila, removerDaFila, enfileirar, type AcaoPendente } from "../utils/filaOffline";

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

// só é "sem conexão" quando a request nem chegou a sair (sem response) —
// um 400/403 real da API não deve ficar reenfileirado pra sempre.
function ehErroDeConexao(error: unknown) {
  return error instanceof AxiosError && !error.response;
}

export function useSincronizarFila() {
  const [pendentes, setPendentes] = useState(() => lerFila().length);

  const sincronizar = useCallback(async () => {
    let fila = lerFila();
    for (const acao of fila) {
      try {
        await executarAcao(acao);
        fila = removerDaFila(acao.id);
      } catch (error) {
        if (ehErroDeConexao(error)) break;
        // erro real (não é de conexão) — descarta pra não travar a fila
        // com uma ação que nunca vai ter sucesso.
        fila = removerDaFila(acao.id);
      }
    }
    setPendentes(fila.length);
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
