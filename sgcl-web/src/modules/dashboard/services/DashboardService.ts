import { ApiClient } from "../../../shared/api/ApiClient";
import type { AlertaDashboard, DashboardResumoPeriodo, PeriodoOpcao, UnidadeDashboard } from "../types";

export class DashboardService {
  static async resumoPeriodo(periodo: PeriodoOpcao) {
    return ApiClient.get<DashboardResumoPeriodo>(`/dashboard/periodo?periodo=${periodo}`);
  }

  static async alertas() {
    return ApiClient.get<AlertaDashboard[]>("/dashboard/alertas");
  }

  static async unidades(periodo: PeriodoOpcao) {
    return ApiClient.get<UnidadeDashboard[]>(`/dashboard/unidades?periodo=${periodo}`);
  }
}
