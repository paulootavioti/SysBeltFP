import { useCallback, useState } from "react";

import { useSecaoDashboard } from "../../dashboard/hooks/useDashboard";
import { FinanceiroService } from "../services/FinanceiroService";
import type { FiltrosFinanceiro, PeriodoOpcao } from "../types";
import type { MensalidadeComAluno } from "../../mensalidades/types";

// Mesmo padrão de carregamento independente por seção do dashboard geral
// (useSecaoDashboard, exportado de dashboard/hooks/useDashboard) — uma
// seção falhar (ex.: fluxo de caixa) nunca trava as demais.
export function useFinanceiroDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoOpcao>("MENSAL");
  const [unidadeId, setUnidadeId] = useState<number | undefined>(undefined);
  const [professorId, setProfessorId] = useState<number | undefined>(undefined);

  const filtros: FiltrosFinanceiro = { periodo, unidadeId, professorId };
  const depsFiltros = [periodo, unidadeId, professorId];

  const [dashboard, recarregarDashboard] = useSecaoDashboard(
    () => FinanceiroService.dashboard(filtros),
    "Erro ao carregar os indicadores financeiros.",
    depsFiltros
  );

  const [fluxoCaixa, recarregarFluxoCaixa] = useSecaoDashboard(
    () => FinanceiroService.fluxoCaixa(filtros),
    "Erro ao carregar o fluxo de caixa.",
    depsFiltros
  );

  const [contasAReceber, recarregarContasAReceber] = useSecaoDashboard<MensalidadeComAluno[]>(
    () => FinanceiroService.contasAReceber(filtros),
    "Erro ao carregar contas a receber.",
    depsFiltros
  );

  const [contasPagas, recarregarContasPagas] = useSecaoDashboard<MensalidadeComAluno[]>(
    () => FinanceiroService.contasPagas(filtros),
    "Erro ao carregar contas pagas.",
    depsFiltros
  );

  const [contasVencidas, recarregarContasVencidas] = useSecaoDashboard<MensalidadeComAluno[]>(
    () => FinanceiroService.contasVencidas(filtros),
    "Erro ao carregar contas vencidas.",
    depsFiltros
  );

  const [canceladas, recarregarCanceladas] = useSecaoDashboard<MensalidadeComAluno[]>(
    () => FinanceiroService.canceladas(filtros),
    "Erro ao carregar cobranças canceladas.",
    depsFiltros
  );

  const [estornos, recarregarEstornos] = useSecaoDashboard<MensalidadeComAluno[]>(
    () => FinanceiroService.estornos(filtros),
    "Erro ao carregar estornos.",
    depsFiltros
  );

  const recarregarTudo = useCallback(() => {
    recarregarDashboard();
    recarregarFluxoCaixa();
    recarregarContasAReceber();
    recarregarContasPagas();
    recarregarContasVencidas();
    recarregarCanceladas();
    recarregarEstornos();
  }, [
    recarregarDashboard,
    recarregarFluxoCaixa,
    recarregarContasAReceber,
    recarregarContasPagas,
    recarregarContasVencidas,
    recarregarCanceladas,
    recarregarEstornos,
  ]);

  return {
    periodo,
    definirPeriodo: setPeriodo,
    unidadeId,
    definirUnidadeId: setUnidadeId,
    professorId,
    definirProfessorId: setProfessorId,
    filtros,

    dashboard,
    fluxoCaixa,
    contasAReceber,
    contasPagas,
    contasVencidas,
    canceladas,
    estornos,

    recarregarDashboard,
    recarregarFluxoCaixa,
    recarregarContasAReceber,
    recarregarContasPagas,
    recarregarContasVencidas,
    recarregarCanceladas,
    recarregarEstornos,
    recarregarTudo,
  };
}
