import { ApiClient } from "../../shared/api/ApiClient";

export interface DashboardResumo {
  alunosAtivos: number;
  responsaveis: number;
  mensalidadesPendentes: number;
  mensalidadesVencidas: number;
  totalRecebido: number;
  totalPendente: number;
  presencasHoje: number;
  graduacoes: number;
  competicoes: number;
}

export class DashboardService {
  static async resumo() {
    return ApiClient.get<DashboardResumo>("/dashboard");
  }
}