import { ApiClient } from "../../../shared/api/ApiClient";
import { api } from "../../../services/api";
import type { MensalidadeComAluno } from "../../mensalidades/types";
import type { DashboardFinanceiro, FinanceiroResumo, FiltrosFinanceiro, PontoFluxoCaixa } from "../types";

export type { FinanceiroResumo };

function montarQuery(filtros: FiltrosFinanceiro = {}): string {
  const params = new URLSearchParams();

  if (filtros.periodo) params.set("periodo", filtros.periodo);
  if (filtros.unidadeId) params.set("unidadeId", String(filtros.unidadeId));
  if (filtros.professorId) params.set("professorId", String(filtros.professorId));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export type TipoExportacaoFinanceiro = "RECEBER" | "PAGAS" | "VENCIDAS" | "CANCELADAS" | "ESTORNOS";

export class FinanceiroService {
  static async resumo() {
    return ApiClient.get<FinanceiroResumo>("/financeiro/resumo");
  }

  static async contasAReceber(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<MensalidadeComAluno[]>(`/financeiro/contas-a-receber${montarQuery(filtros)}`);
  }

  static async contasPagas(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<MensalidadeComAluno[]>(`/financeiro/contas-pagas${montarQuery(filtros)}`);
  }

  static async contasVencidas(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<MensalidadeComAluno[]>(`/financeiro/contas-vencidas${montarQuery(filtros)}`);
  }

  static async canceladas(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<MensalidadeComAluno[]>(`/financeiro/canceladas${montarQuery(filtros)}`);
  }

  static async estornos(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<MensalidadeComAluno[]>(`/financeiro/estornos${montarQuery(filtros)}`);
  }

  static async fluxoCaixa(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<PontoFluxoCaixa[]>(`/financeiro/fluxo-caixa${montarQuery(filtros)}`);
  }

  static async dashboard(filtros?: FiltrosFinanceiro) {
    return ApiClient.get<DashboardFinanceiro>(`/financeiro/dashboard${montarQuery(filtros)}`);
  }

  // Exportação devolve texto CSV puro (não JSON) — usa o cliente axios
  // direto, com responseType "blob", pra permitir o download no navegador.
  static async exportar(tipo: TipoExportacaoFinanceiro, filtros?: FiltrosFinanceiro) {
    const params = new URLSearchParams(montarQuery(filtros).replace(/^\?/, ""));
    params.set("tipo", tipo);

    const response = await api.get(`/financeiro/exportar?${params.toString()}`, { responseType: "blob" });
    return response.data as Blob;
  }
}
