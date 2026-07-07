import { ApiClient } from "../../../shared/api/ApiClient";

export interface FinanceiroResumo {
  totalRecebido: number;
  totalPendente: number;
  inadimplentes: number;
}

export class FinanceiroService {
  static async resumo() {
    return ApiClient.get<FinanceiroResumo>("/financeiro/resumo");
  }
}