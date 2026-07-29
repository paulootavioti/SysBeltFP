import { useCallback, useEffect, useState } from "react";

import { DashboardService } from "../services/DashboardService";
import { GraduacaoService } from "../../graduacoes/services/GraduacaoService";
import { MetaService } from "../../metas/services/MetaService";
import { EventoService } from "../../eventos/services/EventoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

import type { AlertaDashboard, DashboardResumoPeriodo, PeriodoOpcao, UnidadeDashboard } from "../types";
import type { AlunoElegivel } from "../../graduacoes/types";
import type { MetaDashboard } from "../../metas/types";
import type { Evento } from "../../eventos/types";

export interface SecaoEstado<T> {
  dados: T | null;
  carregando: boolean;
  erro: string;
}

function estadoInicial<T>(): SecaoEstado<T> {
  return { dados: null, carregando: true, erro: "" };
}

// Cada seção do dashboard carrega, falha e recarrega de forma independente
// — um erro numa seção (ex.: Eventos, que ainda é mock) nunca impede as
// outras (ex.: os indicadores financeiros) de aparecer. O booleano `ativo`
// evita `setState` depois que o componente desmontou ou o efeito foi
// re-disparado (mesmo padrão já usado no restante do app, sem
// AbortController porque o backend não suporta cancelamento de requisição).
function useSecaoDashboard<T>(
  buscar: () => Promise<T>,
  mensagemErro: string,
  deps: unknown[]
): [SecaoEstado<T>, () => void] {
  const [estado, setEstado] = useState<SecaoEstado<T>>(estadoInicial<T>);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado((atual) => ({ ...atual, carregando: true, erro: "" }));

    buscar()
      .then((dados) => {
        if (ativo) setEstado({ dados, carregando: false, erro: "" });
      })
      .catch((error) => {
        if (ativo) setEstado({ dados: null, carregando: false, erro: getApiErrorMessage(error, mensagemErro) });
      });

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tentativa]);

  const recarregar = useCallback(() => setTentativa((atual) => atual + 1), []);

  return [estado, recarregar];
}

export function useDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoOpcao>("MENSAL");

  const [resumoPeriodo, recarregarResumoPeriodo] = useSecaoDashboard(
    () => DashboardService.resumoPeriodo(periodo),
    "Erro ao carregar os indicadores do período.",
    [periodo]
  );

  const [unidades, recarregarUnidades] = useSecaoDashboard(
    () => DashboardService.unidades(periodo),
    "Erro ao carregar as unidades.",
    [periodo]
  );

  const [alertas, recarregarAlertas] = useSecaoDashboard(
    () => DashboardService.alertas(),
    "Erro ao carregar os alertas.",
    []
  );

  const [graduacoes, recarregarGraduacoes] = useSecaoDashboard<AlunoElegivel[]>(
    () => GraduacaoService.listarProximas(),
    "Erro ao carregar as próximas graduações.",
    []
  );

  // Metas e Eventos ainda não têm backend próprio nesta fase — os
  // services abaixo são mocks temporários (ver comentário em cada um).
  const [metas, recarregarMetas] = useSecaoDashboard<MetaDashboard[]>(
    () => MetaService.listarDashboard(),
    "Erro ao carregar as metas.",
    []
  );

  const [eventos, recarregarEventos] = useSecaoDashboard<Evento[]>(
    () => EventoService.listarDashboard(),
    "Erro ao carregar campanhas e seminários.",
    []
  );

  const recarregarTudo = useCallback(() => {
    recarregarResumoPeriodo();
    recarregarUnidades();
    recarregarAlertas();
    recarregarGraduacoes();
    recarregarMetas();
    recarregarEventos();
  }, [recarregarResumoPeriodo, recarregarUnidades, recarregarAlertas, recarregarGraduacoes, recarregarMetas, recarregarEventos]);

  return {
    periodo,
    definirPeriodo: setPeriodo,
    resumoPeriodo,
    unidades,
    alertas,
    graduacoes,
    metas,
    eventos,
    recarregarResumoPeriodo,
    recarregarUnidades,
    recarregarAlertas,
    recarregarGraduacoes,
    recarregarMetas,
    recarregarEventos,
    recarregarTudo,
  };
}

export type { DashboardResumoPeriodo, AlertaDashboard, UnidadeDashboard };
