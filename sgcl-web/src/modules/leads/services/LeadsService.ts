import { ApiClient } from "../../../shared/api/ApiClient";
import type { Lead, StatusLead } from "../types";

export interface FiltrosLeads {
  status?: StatusLead;
}

export class LeadsService {
  static async listar(filtros: FiltrosLeads = {}) {
    const params = new URLSearchParams();
    if (filtros.status) params.set("status", filtros.status);

    const query = params.toString();
    return ApiClient.get<Lead[]>(`/leads${query ? `?${query}` : ""}`);
  }

  static async atualizarStatus(id: number, status: StatusLead) {
    return ApiClient.patch<Lead>(`/leads/${id}/status`, { status });
  }
}
