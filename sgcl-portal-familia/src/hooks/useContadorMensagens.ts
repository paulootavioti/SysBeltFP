import { useEffect, useState } from "react";

import { useAuth } from "../contexts/useAuth";
import { PortalService } from "../modules/portal/services/PortalService";

const INTERVALO_ATUALIZACAO_MS = 60000;

// Mensagens não lidas por aluno vinculado à sessão — mesmo padrão de
// polling do menu do sgcl-web (busca ao montar + a cada 60s). Falha
// silenciosa: se a busca der erro, os indicadores só somem, nunca
// travam a navegação.
export function useContadorMensagens() {
  const { token, alunos } = useAuth();
  const [naoLidasPorAluno, setNaoLidasPorAluno] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!token) return;

    let ativo = true;

    async function carregar() {
      try {
        const dados = await PortalService.mensagensNaoLidas();
        if (!ativo) return;

        const mapa: Record<number, number> = {};
        for (const item of dados) mapa[item.alunoId] = item.naoLidas;
        setNaoLidasPorAluno(mapa);
      } catch {
        // silencioso: indicador some, não trava a UI
      }
    }

    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [token, alunos.length]);

  return naoLidasPorAluno;
}
