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

export type Periodo = "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL";

export interface PontoSerie {
  rotulo: string;
  valor: number;
}

export interface DashboardResumoPeriodo {
  periodo: Periodo;
  rangeInicio: string;
  rangeFim: string;
  kpis: {
    presencas: number;
    receita: number;
    novosAlunos: number;
    graduacoes: number;
  };
  seriesReceita: PontoSerie[];
  seriesFrequencia: PontoSerie[];
  seriesNovasMatriculas: PontoSerie[];
}

export class DashboardService {
  static async resumo() {
    return ApiClient.get<DashboardResumo>("/dashboard");
  }

  static async resumoPeriodo(periodo: Periodo) {
    return ApiClient.get<DashboardResumoPeriodo>(`/dashboard/periodo?periodo=${periodo}`);
  }
}