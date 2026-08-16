import { useCallback, useEffect, useState } from "react";

import { DashboardService } from "../services/DashboardService";
import { GraduacaoService } from "../../graduacoes/services/GraduacaoService";
import { MetaService } from "../../metas/services/MetaService";
import { EventoService } from "../../eventos/services/EventoService";
import { LojaService } from "../../loja/services/LojaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { useAuth } from "../../../contexts/useAuth";
import { perfilTemAcesso } from "../../../shared/constants/acessoPorPerfil";

import type { AlertaDashboard, DashboardResumoPeriodo, PeriodoOpcao, UnidadeDashboard } from "../types";
import type { AlunoElegivel } from "../../graduacoes/types";
import type { MetaDashboard } from "../../metas/types";
import type { Evento } from "../../eventos/types";
import type { LojaKpis } from "../../loja/types";

export interface SecaoEstado<T> {
  dados: T | null;
  carregando: boolean;
  erro: string;
}

function estadoInicial<T>(): SecaoEstado<T> {
  return { dados: null, carregando: true, erro: "" };
}

// Cada seção do dashboard carrega, falha e recarrega de forma independente
// — um erro numa seção nunca impede as outras de aparecer. O booleano
// `ativo` evita `setState` depois que o componente desmontou ou o efeito
// foi re-disparado (mesmo padrão já usado no restante do app, sem
// AbortController porque o backend não suporta cancelamento de requisição).
// Exportado pra ser reaproveitado por outros dashboards de seção
// independente (ex.: o dashboard financeiro).
export function useSecaoDashboard<T>(
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
  const { usuario } = useAuth();
  const podeVerLoja = perfilTemAcesso(usuario?.perfil, "/loja");

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

  // A loja é gerida só por DONO/ADMIN — pros demais perfis a seção nem
  // é renderizada, então evita a chamada (que voltaria 403) resolvendo pra
  // null direto.
  const [loja, recarregarLoja] = useSecaoDashboard<LojaKpis | null>(
    () => (podeVerLoja ? LojaService.kpis() : Promise.resolve(null)),
    "Erro ao carregar os indicadores da loja.",
    [podeVerLoja]
  );

  const recarregarTudo = useCallback(() => {
    recarregarResumoPeriodo();
    recarregarUnidades();
    recarregarAlertas();
    recarregarGraduacoes();
    recarregarMetas();
    recarregarEventos();
    recarregarLoja();
  }, [
    recarregarResumoPeriodo,
    recarregarUnidades,
    recarregarAlertas,
    recarregarGraduacoes,
    recarregarMetas,
    recarregarEventos,
    recarregarLoja,
  ]);

  return {
    periodo,
    definirPeriodo: setPeriodo,
    resumoPeriodo,
    unidades,
    alertas,
    graduacoes,
    metas,
    eventos,
    loja,
    podeVerLoja,
    recarregarResumoPeriodo,
    recarregarUnidades,
    recarregarAlertas,
    recarregarGraduacoes,
    recarregarMetas,
    recarregarEventos,
    recarregarLoja,
    recarregarTudo,
  };
}

export type { DashboardResumoPeriodo, AlertaDashboard, UnidadeDashboard };
