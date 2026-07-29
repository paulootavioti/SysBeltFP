import { useEffect, useState } from "react";
import { useAuth } from "../contexts/useAuth";
import { NotificacoesService, type ContadoresMenu } from "../shared/services/NotificacoesService";

const CONTADORES_VAZIOS: ContadoresMenu = {
  mensalidadesVencidas: 0,
  contratosAguardandoAssinatura: 0,
  graduacoesPendentes: 0,
};

const INTERVALO_ATUALIZACAO_MS = 60000;

// Números dos badges do menu lateral — mesmo padrão de polling do
// NotificationBell (busca ao montar + a cada 60s). Falha silenciosa: se
// a busca der erro, o menu simplesmente fica sem badge, nunca quebra a
// navegação.
export function useContadoresMenu() {
  const { usuario } = useAuth();
  const [contadores, setContadores] = useState<ContadoresMenu>(CONTADORES_VAZIOS);

  useEffect(() => {
    if (!usuario) return;

    let ativo = true;

    async function carregar() {
      try {
        const dados = await NotificacoesService.contadoresMenu();
        if (ativo) setContadores(dados);
      } catch {
        // silencioso: badge some, não trava a UI
      }
    }

    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [usuario]);

  return contadores;
}
